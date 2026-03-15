"use server"

import "server-only"
import { cache } from "react"
import { revalidatePath } from "next/cache"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getStripe } from "@/lib/stripe"
import { isRefundEligible } from "@/lib/stripe-utils"

import type { Order } from "@/lib/types"

export async function getSellerStripeStatus() {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return null

  const { data } = await db
    .from("users")
    .select(
      "stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled"
    )
    .eq("id", user.id)
    .single()

  return data
}

export async function getStripeLoginLink() {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: profile } = await db
    .from("users")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single()

  if (!profile?.stripe_account_id) {
    return { error: "No Stripe account connected" }
  }

  const loginLink = await getStripe().accounts.createLoginLink(
    profile.stripe_account_id
  )

  return { url: loginLink.url }
}

export const getBuyerOrders = cache(async () => {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return []

  const { data, error } = await db
    .from("orders")
    .select(
      "*, agent:agents(id, slug, name, profile_image_url, owner:users!owner_id(username))"
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching buyer orders:", error)
    return []
  }

  return data as Order[]
})

export const getSellerOrders = cache(async () => {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return []

  const { data, error } = await db
    .from("orders")
    .select(
      "*, agent:agents(id, slug, name, profile_image_url), buyer:users!buyer_id(username, full_name, avatar_url)"
    )
    .eq("seller_id", user.id)
    .in("status", ["completed", "refunded"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching seller orders:", error)
    return []
  }

  return data as Order[]
})

export async function getOrderForAgent(agentId: string) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return null

  const { data } = await db
    .from("orders")
    .select("*")
    .eq("buyer_id", user.id)
    .eq("agent_id", agentId)
    .eq("status", "completed")
    .maybeSingle()

  return data as Order | null
}

export async function verifyAndFulfillCheckout(
  sessionId: string
): Promise<{ success: boolean }> {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { success: false }

  let session
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId)
  } catch {
    return { success: false }
  }

  if (session.payment_status !== "paid") return { success: false }

  const buyerId = session.metadata?.buyer_id
  if (buyerId !== user.id) return { success: false }

  const adminDb = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: order } = await adminDb
    .from("orders")
    .select("id, status, buyer_id, agent_id")
    .eq("stripe_checkout_session_id", sessionId)
    .single()

  if (!order) return { success: false }

  if (order.status === "completed") return { success: true }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id

  await adminDb
    .from("orders")
    .update({
      status: "completed",
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", order.id)

  const amountCents =
    Number(session.metadata?.amount_cents) || session.amount_total || 0

  await adminDb.from("agent_access").upsert(
    {
      user_id: order.buyer_id,
      agent_id: order.agent_id,
      price_cents_at_acquisition: amountCents,
    },
    { onConflict: "user_id,agent_id" }
  )

  return { success: true }
}

export async function issueSellerRefund(orderId: string, reason?: string) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("seller_id", user.id)
    .eq("status", "completed")
    .single()

  if (!order) return { error: "Order not found" }

  const { data: existingRefund } = await db
    .from("refunds")
    .select("id")
    .eq("order_id", orderId)
    .in("status", ["pending", "succeeded"])
    .maybeSingle()

  if (existingRefund) {
    return { error: "A refund has already been processed for this order" }
  }

  if (!order.stripe_payment_intent_id) {
    return { error: "No payment intent found for this order" }
  }

  const refund = await getStripe().refunds.create({
    payment_intent: order.stripe_payment_intent_id,
    reason: "requested_by_customer",
    reverse_transfer: true,
    refund_application_fee: true,
  })

  const { error: insertError } = await db.from("refunds").insert({
    order_id: orderId,
    stripe_refund_id: refund.id,
    amount_cents: order.amount_cents,
    reason: reason || "Seller-initiated refund",
    refund_method: "stripe",
    status: refund.status === "succeeded" ? "succeeded" : "pending",
  })

  if (insertError) {
    console.error("Error inserting refund:", insertError)
    return { error: "Failed to record refund" }
  }

  if (refund.status === "succeeded") {
    await db
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", orderId)

    await db
      .from("agent_access")
      .delete()
      .eq("user_id", order.buyer_id)
      .eq("agent_id", order.agent_id)
  }

  revalidatePath("/")
  return { success: true }
}

export async function requestRefund(orderId: string, reason?: string) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .eq("status", "completed")
    .single()

  if (!order) return { error: "Order not found" }

  if (!isRefundEligible(order.created_at)) {
    return { error: "Refund window has expired (72 hours)" }
  }

  const { data: existingRefund } = await db
    .from("refunds")
    .select("id")
    .eq("order_id", orderId)
    .in("status", ["pending", "succeeded"])
    .maybeSingle()

  if (existingRefund) {
    return { error: "A refund has already been requested for this order" }
  }

  if (!order.stripe_payment_intent_id) {
    return { error: "No payment intent found for this order" }
  }

  const refund = await getStripe().refunds.create({
    payment_intent: order.stripe_payment_intent_id,
    reason: "requested_by_customer",
    reverse_transfer: true,
    refund_application_fee: true,
  })

  const { error: insertError } = await db.from("refunds").insert({
    order_id: orderId,
    stripe_refund_id: refund.id,
    amount_cents: order.amount_cents,
    reason: reason || "Buyer requested refund",
    refund_method: "stripe",
    status: refund.status === "succeeded" ? "succeeded" : "pending",
  })

  if (insertError) {
    console.error("Error inserting refund:", insertError)
    return { error: "Failed to record refund" }
  }

  if (refund.status === "succeeded") {
    await db
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", orderId)

    await db
      .from("agent_access")
      .delete()
      .eq("user_id", user.id)
      .eq("agent_id", order.agent_id)
  }

  revalidatePath("/")
  return { success: true }
}
