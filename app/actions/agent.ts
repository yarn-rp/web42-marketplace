"use server"

import "server-only"
import { cache } from "react"
import { revalidatePath } from "next/cache"
import { createClient } from "@/db/supabase/server"

import type { Agent, AgentResource } from "@/lib/types"
import type { AgentCardJSON } from "@/lib/agent-card-utils"

export type SortOption = "trending" | "stars" | "interactions" | "recent"

const MARKETPLACE_EXT_URI = "https://web42.ai/ext/marketplace/v1"

function flattenAgentRelations(row: Record<string, any>) {
  const { tags, ...rest } = row
  return {
    ...rest,
    tags: tags
      ?.map((r: any) => r.tag)
      .filter(Boolean) ?? [],
  }
}

function setMarketplaceExtensionParam(
  card: AgentCardJSON,
  params: Record<string, unknown>
): AgentCardJSON {
  const updated = { ...card }
  if (!updated.capabilities) updated.capabilities = {}
  const exts = [...(updated.capabilities.extensions ?? [])]
  const idx = exts.findIndex((e) => e.uri === MARKETPLACE_EXT_URI)
  if (idx >= 0) {
    exts[idx] = { ...exts[idx], params: { ...exts[idx].params, ...params } }
  } else {
    exts.push({ uri: MARKETPLACE_EXT_URI, params })
  }
  updated.capabilities = { ...updated.capabilities, extensions: exts }
  return updated
}

function getSortColumn(sort: SortOption) {
  switch (sort) {
    case "stars":
      return { column: "stars_count", ascending: false }
    case "interactions":
      return { column: "interactions_count", ascending: false }
    case "recent":
      return { column: "created_at", ascending: false }
    case "trending":
    default:
      return { column: "stars_count", ascending: false }
  }
}

export interface GetAgentsResult {
  agents: Agent[]
  totalCount: number
}

const DEFAULT_PAGE_SIZE = 24

export const getAgents = cache(
  async (
    search?: string,
    category?: string,
    tag?: string,
    sort: SortOption = "trending",
    minStars?: string,
    publishedFrom?: string,
    creator?: string,
    page = 1,
    limit = DEFAULT_PAGE_SIZE
  ): Promise<GetAgentsResult> => {
    const db = await createClient()
    const selectOpts = { count: "exact" as const }
    let query = db
      .from("agents")
      .select(
        "*, owner:users!owner_id(id, full_name, avatar_url, username), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)",
        selectOpts
      )

    if (search) {
      query = query.textSearch("search_vector", search, {
        type: "websearch",
        config: "english",
      })
    }

    if (tag) {
      const { data: tagRow } = await db
        .from("tags")
        .select("id")
        .eq("name", tag)
        .maybeSingle()

      if (tagRow) {
        const { data: agentIds } = await db
          .from("agent_tags")
          .select("agent_id")
          .eq("tag_id", tagRow.id)

        if (agentIds && agentIds.length > 0) {
          query = query.in(
            "id",
            agentIds.map((row) => row.agent_id)
          )
        } else {
          return { agents: [], totalCount: 0 }
        }
      } else {
        return { agents: [], totalCount: 0 }
      }
    }

    if (minStars) {
      const min = parseInt(minStars, 10)
      if (!isNaN(min)) query = query.gte("stars_count", min)
    }

    if (publishedFrom) {
      const days = parseInt(publishedFrom, 10)
      if (!isNaN(days)) {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        query = query
          .not("published_at", "is", null)
          .gte("published_at", cutoff.toISOString())
      }
    }

    if (creator) {
      const { data: owner } = await db
        .from("users")
        .select("id")
        .eq("username", creator)
        .maybeSingle()

      if (owner) {
        query = query.eq("owner_id", owner.id)
      } else {
        return { agents: [], totalCount: 0 }
      }
    }

    const { column, ascending } = getSortColumn(sort)
    query = query.order(column, { ascending })

    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await query.range(from, to)

    if (error) {
      console.error("Error fetching agents:", error)
      return { agents: [], totalCount: 0 }
    }

    const agents = (data ?? []).map(flattenAgentRelations) as Agent[]
    return { agents, totalCount: count ?? 0 }
  }
)

export const getFeaturedAgents = cache(async () => {
  const db = await createClient()
  const { data, error } = await db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)")
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
    const db = await createClient()

    const { data: owner } = await db
      .from("users")
      .select("id")
      .eq("username", ownerUsername)
      .single()

    if (!owner) return null

    const { data, error } = await db
      .from("agents")
      .select(
        "*, owner:users!owner_id(id, full_name, avatar_url, username, bio, website, github_handle), tags:agent_tags(tag:tags(id, name))"
      )
      .eq("owner_id", owner.id)
      .eq("slug", `@${ownerUsername}~${agentSlug}`)
      .single()

    if (error) {
      console.error("Error fetching agent:", error)
      return null
    }

    const {
      data: { user },
    } = await db.auth.getUser()

    let hasStarred = false
    let hasAccess = false
    if (user) {
      const { data: star } = await db
        .from("stars")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("agent_id", data.id)
        .maybeSingle()
      hasStarred = !!star

      const { data: access } = await db.rpc("has_agent_access", {
        p_user_id: user.id,
        p_agent_id: data.id,
      })
      hasAccess = access === true
    }

    return {
      ...flattenAgentRelations(data),
      has_starred: hasStarred,
      has_access: hasAccess,
    } as Agent
  }
)

export const getAgentsByUser = cache(async (username: string) => {
  const db = await createClient()

  const { data: owner } = await db
    .from("users")
    .select("id")
    .eq("username", username)
    .single()

  if (!owner) return []

  const { data, error } = await db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)")
    .eq("owner_id", owner.id)
    .order("stars_count", { ascending: false })

  if (error) {
    console.error("Error fetching user agents:", error)
    return []
  }

  return (data ?? []).map(flattenAgentRelations) as Agent[]
})

export const getMyAgents = cache(async () => {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return []

  const { data, error } = await db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching my agents:", error)
    return []
  }

  return (data ?? []).map(flattenAgentRelations) as Agent[]
})

export const getPurchasedAgents = cache(async () => {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return []

  const { data: accessRows, error: accessError } = await db
    .from("agent_access")
    .select("agent_id")
    .eq("user_id", user.id)

  if (accessError || !accessRows?.length) return []

  const agentIds = accessRows.map((r) => r.agent_id)

  const { data, error } = await db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)")
    .in("id", agentIds)
    .neq("owner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching purchased agents:", error)
    return []
  }

  return (data ?? []).map(flattenAgentRelations) as Agent[]
})

export async function starAgent(agentId: string) {
  const db = await createClient()
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
  const db = await createClient()
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

// ============================================================
// Agent access / entitlement
// ============================================================

export async function hasAgentAccess(agentId: string): Promise<boolean> {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return false

  const { data } = await db.rpc("has_agent_access", {
    p_user_id: user.id,
    p_agent_id: agentId,
  })

  return data === true
}

export async function acquireAgent(agentId: string) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db.from("agent_access").insert({
    user_id: user.id,
    agent_id: agentId,
  })

  if (error) {
    if (error.code === "23505") {
      return { success: true }
    }
    console.error("Error acquiring agent:", error)
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export const getMyAgentBySlug = cache(async (slug: string) => {
  const db = await createClient()
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

export async function deleteAgent(
  agentId: string,
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db
    .from("agents")
    .delete()
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error deleting agent:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  revalidatePath("/explore")
  return { success: true }
}


// ============================================================
// Publishing actions
// ============================================================

export interface PublishValidation {
  readme: boolean
  profileImage: boolean
  resources: boolean
  tags: boolean
  resourceCount: number
  isFree: boolean
}

export async function getPublishValidation(
  agentId: string
): Promise<PublishValidation> {
  const db = await createClient()

  const { data: agent } = await db
    .from("agents")
    .select("readme, profile_image_url")
    .eq("id", agentId)
    .single()

  const { count: resourceCount } = await db
    .from("agent_resources")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)

  const { count: tagCount } = await db
    .from("agent_tags")
    .select("agent_id", { count: "exact", head: true })
    .eq("agent_id", agentId)

  const rc = resourceCount ?? 0

  return {
    readme: !!agent?.readme && agent.readme.trim().length > 50,
    profileImage: !!agent?.profile_image_url,
    resources: rc >= 3,
    tags: (tagCount ?? 0) >= 1,
    resourceCount: rc,
    isFree: true,
  }
}

export async function publishAgent(agentId: string, profileUsername: string) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const validation = await getPublishValidation(agentId)
  const errors: string[] = []

  if (!validation.readme) errors.push("README must be at least 50 characters")
  if (!validation.tags) errors.push("At least 1 tag is required")

  if (errors.length > 0) {
    return { error: errors.join(". "), validation }
  }

  const { data: agent } = await db
    .from("agents")
    .select("agent_card")
    .eq("id", agentId)
    .eq("owner_id", user.id)
    .single()

  if (!agent) return { error: "Agent not found" }

  const updatedCard = setMarketplaceExtensionParam(
    (agent.agent_card ?? { name: "", description: "" }) as AgentCardJSON,
    { visibility: "public" }
  )

  const { error } = await db
    .from("agents")
    .update({
      agent_card: updatedCard,
      published_at: new Date().toISOString(),
    })
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error publishing agent:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  revalidatePath("/explore")
  revalidatePath("/")
  return { success: true }
}

export async function unpublishAgent(agentId: string, profileUsername: string) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: agent } = await db
    .from("agents")
    .select("agent_card")
    .eq("id", agentId)
    .eq("owner_id", user.id)
    .single()

  if (!agent) return { error: "Agent not found" }

  const updatedCard = setMarketplaceExtensionParam(
    (agent.agent_card ?? { name: "", description: "" }) as AgentCardJSON,
    { visibility: "private" }
  )

  const { error } = await db
    .from("agents")
    .update({ agent_card: updatedCard })
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error unpublishing agent:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  revalidatePath("/explore")
  revalidatePath("/")
  return { success: true }
}

// ============================================================
// Agent resources
// ============================================================

export const getAgentResources = cache(async (agentId: string) => {
  const db = await createClient()
  const { data, error } = await db
    .from("agent_resources")
    .select("*")
    .eq("agent_id", agentId)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching agent resources:", error)
    return []
  }

  return data as AgentResource[]
})

export async function createAgentResource(
  agentId: string,
  resource: {
    title: string
    description?: string
    type: "video" | "image" | "document"
    url: string
    thumbnail_url?: string
  },
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { count } = await db
    .from("agent_resources")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)

  const { data, error } = await db
    .from("agent_resources")
    .insert({
      agent_id: agentId,
      title: resource.title,
      description: resource.description ?? "",
      type: resource.type,
      url: resource.url,
      thumbnail_url: resource.thumbnail_url,
      sort_order: (count ?? 0),
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating agent resource:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  return { success: true, resource: data as AgentResource }
}

export async function deleteAgentResource(
  resourceId: string,
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db
    .from("agent_resources")
    .delete()
    .eq("id", resourceId)

  if (error) {
    console.error("Error deleting agent resource:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  return { success: true }
}

export async function reorderAgentResources(
  agentId: string,
  orderedIds: string[],
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const updates = orderedIds.map((id, index) =>
    db
      .from("agent_resources")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("agent_id", agentId)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)

  if (failed?.error) {
    console.error("Error reordering resources:", failed.error)
    return { error: failed.error.message }
  }

  revalidatePath(`/${profileUsername}`)
  return { success: true }
}

// ============================================================
// Agent metadata updates (profile image, license, tags)
// ============================================================

export async function updateAgentDetails(
  agentId: string,
  fields: { name?: string; description?: string },
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  if (fields.name !== undefined) {
    const trimmed = fields.name.trim()
    if (!trimmed) return { error: "Name cannot be empty" }
    if (trimmed.length > 100) return { error: "Name must be 100 characters or fewer" }
  }
  if (fields.description !== undefined) {
    if (fields.description.length > 500)
      return { error: "Description must be 500 characters or fewer" }
  }

  if (fields.name === undefined && fields.description === undefined) {
    return { error: "Nothing to update" }
  }

  const { data: agent } = await db
    .from("agents")
    .select("agent_card")
    .eq("id", agentId)
    .eq("owner_id", user.id)
    .single()

  if (!agent) return { error: "Agent not found" }

  const updatedCard: AgentCardJSON = {
    ...((agent.agent_card ?? { name: "", description: "" }) as AgentCardJSON),
  }
  if (fields.name !== undefined) updatedCard.name = fields.name.trim()
  if (fields.description !== undefined)
    updatedCard.description = fields.description.trim()

  const { error } = await db
    .from("agents")
    .update({ agent_card: updatedCard })
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error updating agent details:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  return { success: true }
}

export async function updateAgentReadme(
  agentId: string,
  readme: string,
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db
    .from("agents")
    .update({ readme })
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error updating agent readme:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  return { success: true }
}

export async function updateAgentProfileImage(
  agentId: string,
  profileImageUrl: string | null,
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db
    .from("agents")
    .update({ profile_image_url: profileImageUrl })
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error updating agent profile image:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  return { success: true }
}

export async function toggleAgentVisibility(
  agentId: string,
  visibility: "public" | "private" | "unlisted",
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: agent } = await db
    .from("agents")
    .select("agent_card")
    .eq("id", agentId)
    .eq("owner_id", user.id)
    .single()

  if (!agent) return { error: "Agent not found" }

  const updatedCard = setMarketplaceExtensionParam(
    (agent.agent_card ?? { name: "", description: "" }) as AgentCardJSON,
    { visibility }
  )

  const { error } = await db
    .from("agents")
    .update({ agent_card: updatedCard })
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error updating agent visibility:", error)
    return { error: error.message }
  }

  revalidatePath(`/${profileUsername}`)
  return { success: true }
}

export async function updateAgentTags(
  agentId: string,
  tagIds: string[],
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error: deleteError } = await db
    .from("agent_tags")
    .delete()
    .eq("agent_id", agentId)

  if (deleteError) {
    console.error("Error clearing agent tags:", deleteError)
    return { error: deleteError.message }
  }

  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({ agent_id: agentId, tag_id: tagId }))
    const { error: insertError } = await db
      .from("agent_tags")
      .insert(rows)

    if (insertError) {
      console.error("Error inserting agent tags:", insertError)
      return { error: insertError.message }
    }
  }

  revalidatePath(`/${profileUsername}`)
  return { success: true }
}

export async function createTagAndAssign(
  agentId: string,
  tagName: string,
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const trimmed = tagName.trim().toLowerCase()
  if (!trimmed) return { error: "Tag name cannot be empty" }

  const { data: existing } = await db
    .from("tags")
    .select("id, name, created_at")
    .ilike("name", trimmed)
    .maybeSingle()

  let tagId: string

  if (existing) {
    tagId = existing.id
  } else {
    const { data: created, error: createError } = await db
      .from("tags")
      .insert({ name: trimmed })
      .select("id, name, created_at")
      .single()

    if (createError || !created) {
      console.error("Error creating tag:", createError)
      return { error: createError?.message ?? "Failed to create tag" }
    }
    tagId = created.id
  }

  const { error: linkError } = await db
    .from("agent_tags")
    .upsert(
      { agent_id: agentId, tag_id: tagId },
      { onConflict: "agent_id,tag_id" }
    )

  if (linkError) {
    console.error("Error assigning tag:", linkError)
    return { error: linkError.message }
  }

  revalidatePath(`/${profileUsername}`)
  return {
    success: true,
    tag: existing ?? {
      id: tagId,
      name: trimmed,
      created_at: new Date().toISOString(),
    },
  }
}
