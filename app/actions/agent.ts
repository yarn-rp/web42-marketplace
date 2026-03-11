"use server"

import "server-only"
import { cache } from "react"
import { revalidatePath } from "next/cache"
import { createClient } from "@/db/supabase/server"

import type { Agent, AgentVisibility } from "@/lib/types"

export type SortOption = "trending" | "stars" | "installs" | "recent"

function flattenAgentRelations(row: Record<string, any>) {
  const { categories, tags, ...rest } = row
  return {
    ...rest,
    categories: categories
      ?.map((r: any) => r.category)
      .filter(Boolean) ?? [],
    tags: tags
      ?.map((r: any) => r.tag)
      .filter(Boolean) ?? [],
  }
}

async function hydrateRemixSource(
  db: ReturnType<typeof createClient>,
  agents: Record<string, any>[]
): Promise<void> {
  const remixIds = agents
    .map((a) => a.remixed_from_id)
    .filter(Boolean) as string[]

  if (remixIds.length === 0) return

  const { data: originals } = await db
    .from("agents")
    .select("id, slug, name, owner:users!owner_id(username)")
    .in("id", remixIds)

  if (!originals) return

  const originalsMap = new Map(originals.map((o: any) => [o.id, o]))

  for (const agent of agents) {
    if (agent.remixed_from_id) {
      agent.remixed_from = originalsMap.get(agent.remixed_from_id) ?? null
    }
  }
}

function getSortColumn(sort: SortOption) {
  switch (sort) {
    case "stars":
      return { column: "stars_count", ascending: false }
    case "installs":
      return { column: "installs_count", ascending: false }
    case "recent":
      return { column: "created_at", ascending: false }
    case "trending":
    default:
      return { column: "stars_count", ascending: false }
  }
}

export const getAgents = cache(
  async (
    search?: string,
    category?: string,
    tag?: string,
    sort: SortOption = "trending"
  ) => {
    const db = createClient()
    let query = db
      .from("agents")
      .select("*, owner:users!owner_id(id, full_name, avatar_url, username), categories:agent_categories(category:categories(id, name, icon))")

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`
      )
    }

    if (category) {
      const { data: cat } = await db
        .from("categories")
        .select("id")
        .eq("name", category)
        .maybeSingle()

      if (cat) {
        const { data: agentIds } = await db
          .from("agent_categories")
          .select("agent_id")
          .eq("category_id", cat.id)

        if (agentIds && agentIds.length > 0) {
          query = query.in(
            "id",
            agentIds.map((row) => row.agent_id)
          )
        } else {
          return []
        }
      } else {
        return []
      }
    }

    const { column, ascending } = getSortColumn(sort)
    query = query.order(column, { ascending })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching agents:", error)
      return []
    }

    return (data ?? []).map(flattenAgentRelations) as Agent[]
  }
)

export const getFeaturedAgents = cache(async () => {
  const db = createClient()
  const { data, error } = await db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username), categories:agent_categories(category:categories(id, name, icon))")
    .eq("featured", true)
    .order("stars_count", { ascending: false })
    .limit(6)

  if (error) {
    console.error("Error fetching featured agents:", error)
    return []
  }

  return (data ?? []).map(flattenAgentRelations) as Agent[]
})

export const getAgentBySlug = cache(
  async (ownerUsername: string, agentSlug: string) => {
    const db = createClient()

    const { data: owner } = await db
      .from("users")
      .select("id")
      .eq("username", ownerUsername)
      .single()

    if (!owner) return null

    const { data, error } = await db
      .from("agents")
      .select(
        "*, owner:users!owner_id(id, full_name, avatar_url, username, bio, website, github_handle), categories:agent_categories(category:categories(id, name, icon)), tags:agent_tags(tag:tags(id, name))"
      )
      .eq("owner_id", owner.id)
      .eq("slug", agentSlug)
      .single()

    if (error) {
      console.error("Error fetching agent:", error)
      return null
    }

    await hydrateRemixSource(db, [data])

    const {
      data: { user },
    } = await db.auth.getUser()

    let hasStarred = false
    if (user) {
      const { data: star } = await db
        .from("stars")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("agent_id", data.id)
        .maybeSingle()
      hasStarred = !!star
    }

    return {
      ...flattenAgentRelations(data),
      remixed_from: data.remixed_from ?? null,
      has_starred: hasStarred,
    } as Agent
  }
)

export const getAgentsByUser = cache(async (username: string) => {
  const db = createClient()

  const { data: owner } = await db
    .from("users")
    .select("id")
    .eq("username", username)
    .single()

  if (!owner) return []

  const { data, error } = await db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username)")
    .eq("owner_id", owner.id)
    .order("stars_count", { ascending: false })

  if (error) {
    console.error("Error fetching user agents:", error)
    return []
  }

  await hydrateRemixSource(db, data ?? [])

  return data as Agent[]
})

export const getMyAgents = cache(async () => {
  const db = createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return []

  const { data, error } = await db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching my agents:", error)
    return []
  }

  await hydrateRemixSource(db, data ?? [])

  return data as Agent[]
})

export async function starAgent(agentId: string) {
  const db = createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db
    .from("stars")
    .insert({ user_id: user.id, agent_id: agentId })

  if (error) {
    console.error("Error starring agent:", error)
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function unstarAgent(agentId: string) {
  const db = createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db
    .from("stars")
    .delete()
    .eq("user_id", user.id)
    .eq("agent_id", agentId)

  if (error) {
    console.error("Error unstarring agent:", error)
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function remixAgent(agentId: string) {
  const db = createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: original, error: fetchError } = await db
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single()

  if (fetchError || !original) {
    return { error: "Agent not found" }
  }

  const { data: remix, error: insertError } = await db
    .from("agents")
    .insert({
      slug: original.slug,
      name: original.name,
      description: original.description,
      readme: original.readme,
      cover_image_url: original.cover_image_url,
      demo_video_url: original.demo_video_url,
      manifest: original.manifest,
      owner_id: user.id,
      remixed_from_id: agentId,
      visibility: "private",
    })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "You already have an agent with this slug" }
    }
    console.error("Error remixing agent:", insertError)
    return { error: insertError.message }
  }

  await db.rpc("increment_remix_count", { p_agent_id: agentId })
  revalidatePath("/")

  return { success: true, agent: remix }
}

export async function incrementInstallCount(agentId: string) {
  const db = createClient()
  await db.rpc("increment_install_count", { p_agent_id: agentId })
}

export const getMyAgentBySlug = cache(async (slug: string) => {
  const db = createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return null

  const { data, error } = await db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username)")
    .eq("owner_id", user.id)
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Error fetching my agent:", error)
    return null
  }

  return data as Agent
})

export const getAgentFiles = cache(async (agentId: string) => {
  const db = createClient()
  const { data, error } = await db
    .from("agent_files")
    .select("*")
    .eq("agent_id", agentId)
    .order("path", { ascending: true })

  if (error) {
    console.error("Error fetching agent files:", error)
    return []
  }

  return data as import("@/lib/types").AgentFile[]
})

export async function toggleAgentVisibility(
  agentId: string,
  visibility: AgentVisibility,
  profileUsername: string
) {
  const db = createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db
    .from("agents")
    .update({ visibility })
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error updating agent visibility:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  revalidatePath("/explore")
  return { success: true }
}

export async function updateAgentPrice(
  agentId: string,
  priceCents: number,
  profileUsername: string
) {
  const db = createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db
    .from("agents")
    .update({ price_cents: priceCents })
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error updating agent price:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  return { success: true }
}
