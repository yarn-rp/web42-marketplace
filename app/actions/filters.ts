"use server"

import "server-only"
import { cache } from "react"
import { createClient } from "@/db/supabase/server"

import type { Category, Tag } from "@/lib/types"

export const getCachedCategories = cache(async (): Promise<Category[]> => {
  const db = await createClient()
  const { data, error } = await db
    .from("categories")
    .select("*")
    .order("name")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data as Category[]
})

export const getCachedTags = cache(async (): Promise<Tag[]> => {
  const db = await createClient()
  const { data, error } = await db.from("tags").select("*").order("name")

  if (error) {
    console.error("Error fetching tags:", error)
    return []
  }

  return data as Tag[]
})

export interface CreatorSearchResult {
  id: string
  username: string | null
  full_name: string | null
}

export async function searchCreators(query: string): Promise<CreatorSearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const db = await createClient()
  const searchTerm = `%${query.trim()}%`

  const { data: ownerIds } = await db
    .from("agents")
    .select("owner_id")
    .eq("visibility", "public")

  const publicOwnerIds = [...new Set((ownerIds ?? []).map((r) => r.owner_id))]
  if (publicOwnerIds.length === 0) return []

  const { data: users, error } = await db
    .from("users")
    .select("id, username, full_name")
    .in("id", publicOwnerIds)
    .or(`username.ilike."${searchTerm.replace(/"/g, '""')}",full_name.ilike."${searchTerm.replace(/"/g, '""')}"`)
    .limit(10)

  if (error || !users?.length) return []

  return users as CreatorSearchResult[]
}
