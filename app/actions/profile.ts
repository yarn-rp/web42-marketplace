"use server"

import "server-only"
import { cache } from "react"
import { revalidatePath } from "next/cache"
import { createClient } from "@/db/supabase/server"

import type { Profile } from "@/lib/types"

export const getProfile = cache(
  async (username: string): Promise<Profile | null> => {
    const db = await createClient()
    const { data, error } = await db
      .from("users")
      .select("*")
      .eq("username", username)
      .single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    return data as Profile
  }
)

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return null

  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) {
    console.error("Error fetching current profile:", error)
    return null
  }

  return data as Profile
})

export async function updateProfile(formData: FormData) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const updates: Record<string, string> = {}
  const fullName = formData.get("full_name")
  const bio = formData.get("bio")
  const website = formData.get("website")
  const profileReadme = formData.get("profile_readme")

  if (typeof fullName === "string") updates.full_name = fullName
  if (typeof bio === "string") updates.bio = bio
  if (typeof website === "string") updates.website = website
  if (typeof profileReadme === "string") updates.profile_readme = profileReadme

  const { error } = await db.from("users").update(updates).eq("id", user.id)

  if (error) {
    console.error("Error updating profile:", error)
    return { error: error.message }
  }

  const { data: prof } = await db
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single()

  if (prof?.username) {
    revalidatePath(`/${prof.username}`)
  }
  return { success: true }
}

export async function updateProfileReadme(readme: string) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: profile } = await db
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single()

  const { error } = await db
    .from("users")
    .update({ profile_readme: readme })
    .eq("id", user.id)

  if (error) {
    console.error("Error updating profile readme:", error)
    return { error: error.message }
  }

  if (profile?.username) {
    revalidatePath(`/${profile.username}`)
  }
  return { success: true }
}
