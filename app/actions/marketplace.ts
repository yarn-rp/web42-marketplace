"use server"

import { createClient } from "@/db/supabase/server"

export type MarketplaceType = "skills" | "plugins"

export async function requestMarketplaceAccess(
  marketplaceType: MarketplaceType
): Promise<{ success: boolean; error?: string }> {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: profile } = await db
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single()

  const username = profile?.username ?? `user_${user.id.slice(0, 8)}`

  const { error } = await db.from("marketplace_access_requests").upsert(
    {
      user_id: user.id,
      username,
      marketplace_type: marketplaceType,
    },
    {
      onConflict: "user_id,marketplace_type",
      ignoreDuplicates: true,
    }
  )

  if (error) {
    console.error("Error requesting marketplace access:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
