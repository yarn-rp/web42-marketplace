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
