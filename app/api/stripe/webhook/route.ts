import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { getResend, EMAIL_FROM } from "@/lib/email"
import {
  saleNotificationHtml,
  saleNotificationSubject,
} from "@/lib/emails/sale-notification"
import {
  purchaseConfirmationHtml,
  purchaseConfirmationSubject,
} from "@/lib/emails/purchase-confirmation"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminDb = ReturnType<typeof createSupabaseClient<any>>

function getAdminDb(): AdminDb {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const db = getAdminDb()

  switch (event.type) {
    case "checkout.session.completed": {
      await handleCheckoutCompleted(db, event.data.object as Stripe.Checkout.Session)
      break
    }
    case "checkout.session.expired": {
      await handleCheckoutExpired(db, event.data.object as Stripe.Checkout.Session)
      break
    }
    case "account.updated": {
      await handleAccountUpdated(db, event.data.object as Stripe.Account)
      break
    }
    case "charge.refunded": {
      await handleChargeRefunded(db, event.data.object as Stripe.Charge)
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  db: AdminDb,
  session: Stripe.Checkout.Session
) {
  const sessionId = session.id
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id

  const { data: order } = await db
    .from("orders")
    .select("id, status, buyer_id, agent_id")
    .eq("stripe_checkout_session_id", sessionId)
    .single()

  if (!order) {
    console.error("No order found for session:", sessionId)
    return
  }

  if (order.status === "completed") {
    return
  }

  await db
    .from("orders")
    .update({
      status: "completed",
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", order.id)

  const amountCents =
    Number(session.metadata?.amount_cents) || session.amount_total || 0

  await db.from("agent_access").upsert(
    {
      user_id: order.buyer_id,
      agent_id: order.agent_id,
      price_cents_at_acquisition: amountCents,
    },
    { onConflict: "user_id,agent_id" }
  )

  sendPurchaseEmails(db, session, order).catch((err) =>
    console.error("[EMAIL] Failed to send purchase emails:", err)
  )
}

async function sendPurchaseEmails(
  db: AdminDb,
  session: Stripe.Checkout.Session,
  order: { buyer_id: string; agent_id: string }
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY not set, skipping emails")
    return
  }

  const sellerId = session.metadata?.seller_id
  if (!sellerId) {
    console.warn("[EMAIL] No seller_id in session metadata, skipping emails")
    return
  }

  const amountCents = Number(session.metadata?.amount_cents) || 0
  const sellerAmountCents = Number(session.metadata?.seller_amount_cents) || 0

  const [buyerAuth, sellerAuth, profiles, agentResult] = await Promise.all([
    db.auth.admin.getUserById(order.buyer_id),
    db.auth.admin.getUserById(sellerId),
    db
      .from("users")
      .select("id, username")
      .in("id", [order.buyer_id, sellerId]),
    db
      .from("agents")
      .select("name, slug")
      .eq("id", order.agent_id)
      .single(),
  ])

  const buyerEmail = buyerAuth.data?.user?.email
  const sellerEmail = sellerAuth.data?.user?.email
  if (!buyerEmail || !sellerEmail) {
    console.warn("[EMAIL] Missing email addresses — buyer:", !!buyerEmail, "seller:", !!sellerEmail)
    return
  }

  const buyerProfile = profiles.data?.find(
    (p: { id: string }) => p.id === order.buyer_id
  )
  const sellerProfile = profiles.data?.find(
    (p: { id: string }) => p.id === sellerId
  )
  const agentName = agentResult.data?.name ?? "Agent"
  const agentSlug = agentResult.data?.slug ?? ""
  const buyerUsername = buyerProfile?.username ?? "user"
  const sellerUsername = sellerProfile?.username ?? "creator"

  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://web42.ai"
  const agentUrl = `${siteUrl}/${sellerUsername}/${agentSlug}`

  console.log("[EMAIL] Sending purchase emails — seller:", sellerEmail, "buyer:", buyerEmail, "agent:", agentName)

  const emailClient = getResend()

  const results = await Promise.allSettled([
    emailClient.emails.send({
      from: EMAIL_FROM,
      to: sellerEmail,
      subject: saleNotificationSubject(agentName),
      html: saleNotificationHtml({
        buyerUsername,
        buyerEmail,
        agentName,
        amountCents,
        sellerAmountCents,
      }),
    }),
    emailClient.emails.send({
      from: EMAIL_FROM,
      to: buyerEmail,
      subject: purchaseConfirmationSubject(agentName),
      html: purchaseConfirmationHtml({
        sellerUsername,
        sellerEmail,
        agentName,
        agentUrl,
        amountCents,
      }),
    }),
  ])

  results.forEach((result, i) => {
    const label = i === 0 ? "seller" : "buyer"
    if (result.status === "fulfilled") {
      console.log(`[EMAIL] ${label} email sent:`, JSON.stringify(result.value))
    } else {
      console.error(`[EMAIL] ${label} email failed:`, result.reason)
    }
  })
}

async function handleCheckoutExpired(
  db: AdminDb,
  session: Stripe.Checkout.Session
) {
  await db
    .from("orders")
    .update({ status: "failed" })
    .eq("stripe_checkout_session_id", session.id)
    .eq("status", "pending")
}

async function handleAccountUpdated(
  db: AdminDb,
  account: Stripe.Account
) {
  const { error } = await db
    .from("users")
    .update({
      stripe_onboarding_complete: account.details_submitted ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
    })
    .eq("stripe_account_id", account.id)

  if (error) {
    console.error("Error updating user stripe status:", error)
  }
}

async function handleChargeRefunded(
  db: AdminDb,
  charge: Stripe.Charge
) {
  if (!charge.refunds?.data?.length) return

  for (const refund of charge.refunds.data) {
    const { data: existingRefund } = await db
      .from("refunds")
      .select("id, status")
      .eq("stripe_refund_id", refund.id)
      .maybeSingle()

    if (existingRefund) {
      if (existingRefund.status !== "succeeded" && refund.status === "succeeded") {
        await db
          .from("refunds")
          .update({ status: "succeeded" })
          .eq("id", existingRefund.id)
      }
      continue
    }

    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id

    if (!paymentIntentId) continue

    const { data: order } = await db
      .from("orders")
      .select("id, buyer_id, agent_id")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single()

    if (!order) continue

    await db.from("refunds").insert({
      order_id: order.id,
      stripe_refund_id: refund.id,
      amount_cents: refund.amount,
      reason: "Refund via Stripe",
      refund_method: "stripe",
      status: refund.status === "succeeded" ? "succeeded" : "pending",
    })

    if (refund.status === "succeeded") {
      await db
        .from("orders")
        .update({ status: "refunded" })
        .eq("id", order.id)

      await db
        .from("agent_access")
        .delete()
        .eq("user_id", order.buyer_id)
        .eq("agent_id", order.agent_id)
    }
  }
}
