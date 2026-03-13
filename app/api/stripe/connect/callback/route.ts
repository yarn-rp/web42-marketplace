import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { getStripe } from "@/lib/stripe"
import { getSiteUrl } from "@/lib/stripe-api"

export async function GET(request: NextRequest) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  const siteUrl = getSiteUrl(request.headers)

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/login`)
  }

  const { data: profile } = await db
    .from("users")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single()

  if (profile?.stripe_account_id) {
    const account = await getStripe().accounts.retrieve(
      profile.stripe_account_id
    )

    await db
      .from("users")
      .update({
        stripe_onboarding_complete: account.details_submitted ?? false,
        stripe_payouts_enabled: account.payouts_enabled ?? false,
      })
      .eq("id", user.id)
  }

  return NextResponse.redirect(`${siteUrl}/settings?stripe=connected`)
}
