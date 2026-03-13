import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { getStripe } from "@/lib/stripe"

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
