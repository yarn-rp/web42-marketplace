import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { getStripe } from "@/lib/stripe"
import { getSiteUrl } from "@/lib/stripe-api"

export async function POST(request: NextRequest) {
  try {
    const db = await createClient()
    const {
      data: { user },
    } = await db.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: profile } = await db
      .from("users")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single()

    let accountId = profile?.stripe_account_id

    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: "express",
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      })
      accountId = account.id

      const { error: updateError } = await db
        .from("users")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id)

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to save Stripe account" },
          { status: 500 }
        )
      }
    }

    const siteUrl = getSiteUrl(request.headers)
    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/settings?stripe=refresh`,
      return_url: `${siteUrl}/api/stripe/connect/callback`,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
