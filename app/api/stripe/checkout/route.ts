import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { getStripe } from "@/lib/stripe"
import { getSiteUrl } from "@/lib/stripe-api"
import { calculateFees, MIN_PRICE_CENTS, REFUND_WINDOW_DAYS } from "@/lib/stripe-utils"

const MAX_DESCRIPTION_LENGTH = 500

function buildProductDescription(agent: {
  description?: string | null
  readme?: string | null
  manifest?: { skills?: { name: string }[] } | null
}): string {
  const parts: string[] = []

  if (agent.description?.trim()) {
    parts.push(agent.description.trim())
  }

  const skills = agent.manifest?.skills
  if (skills?.length) {
    const skillNames = skills.map((s) => s.name).filter(Boolean).join(", ")
    if (skillNames) {
      parts.push(`Skills: ${skillNames}`)
    }
  }

  if (agent.readme?.trim()) {
    const stripped = agent.readme
      .replace(/^#+\s*/gm, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, " ")
      .trim()
    const excerpt = stripped.slice(0, 300)
    if (excerpt) {
      parts.push(excerpt + (stripped.length > 300 ? "..." : ""))
    }
  }

  const combined = parts.join("\n\n")
  if (combined.length <= MAX_DESCRIPTION_LENGTH) return combined
  return combined.slice(0, MAX_DESCRIPTION_LENGTH - 3) + "..."
}

export async function POST(request: NextRequest) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { agentId } = await request.json()

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 })
  }

  const { data: agent } = await db
    .from("agents")
    .select("id, slug, name, description, readme, manifest, price_cents, currency, owner_id, profile_image_url, owner:users!owner_id(username, stripe_account_id, stripe_payouts_enabled)")
    .eq("id", agentId)
    .single()

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  if (!agent.price_cents || agent.price_cents < MIN_PRICE_CENTS) {
    return NextResponse.json(
      { error: "This agent is free — no checkout needed" },
      { status: 400 }
    )
  }

  const owner = agent.owner as unknown as { username: string; stripe_account_id: string | null; stripe_payouts_enabled: boolean } | null
  if (!owner?.stripe_account_id || !owner.stripe_payouts_enabled) {
    return NextResponse.json(
      { error: "This seller is not set up to receive payments" },
      { status: 400 }
    )
  }

  const { data: existingAccess } = await db.rpc("has_agent_access", {
    p_user_id: user.id,
    p_agent_id: agentId,
  })

  if (existingAccess === true) {
    return NextResponse.json(
      { error: "You already own this agent" },
      { status: 400 }
    )
  }

  const { platformFeeCents, sellerAmountCents } = calculateFees(agent.price_cents)

  const siteUrl = getSiteUrl(request.headers)
  const agentUrl = `${siteUrl}/${owner.username}/${agent.slug}`

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: agent.currency || "usd",
          product_data: {
            name: agent.name,
            description: buildProductDescription(agent),
            ...(agent.profile_image_url
              ? { images: [agent.profile_image_url] }
              : {}),
          },
          unit_amount: agent.price_cents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: owner.stripe_account_id,
      },
    },
    success_url: `${agentUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${agentUrl}?checkout=cancel`,
    metadata: {
      buyer_id: user.id,
      agent_id: agent.id,
      seller_id: agent.owner_id,
      amount_cents: agent.price_cents.toString(),
      platform_fee_cents: platformFeeCents.toString(),
      seller_amount_cents: sellerAmountCents.toString(),
    },
    expires_at: Math.floor(Date.now() / 1000) + 1800,
  })

  const refundDeadline = new Date(
    Date.now() + REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  await db.from("orders").insert({
    buyer_id: user.id,
    agent_id: agent.id,
    seller_id: agent.owner_id,
    stripe_checkout_session_id: session.id,
    amount_cents: agent.price_cents,
    platform_fee_cents: platformFeeCents,
    seller_amount_cents: sellerAmountCents,
    currency: agent.currency || "usd",
    payment_method: "stripe",
    status: "pending",
    refund_eligible_until: refundDeadline,
  })

  return NextResponse.json({ url: session.url })
}
