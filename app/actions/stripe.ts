"use server"

import "server-only"
import { cache } from "react"
import { revalidatePath } from "next/cache"
import { createClient } from "@/db/supabase/server"
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
    .select("*, agent:agents(id, slug, name, profile_image_url)")
    .eq("seller_id", user.id)
    .eq("status", "completed")
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
    return { error: "Refund window has expired (7 days)" }
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
