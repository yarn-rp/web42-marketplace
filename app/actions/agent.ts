"use server"

import "server-only"
import { cache } from "react"
import { revalidatePath } from "next/cache"
import { createClient } from "@/db/supabase/server"

import type { Agent, AgentLicense, AgentResource, AgentVisibility } from "@/lib/types"
import { isFreeLicense, isPaidLicense } from "@/lib/license-utils"

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
  db: Awaited<ReturnType<typeof createClient>>,
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
    platform?: string,
    minPrice?: string,
    maxPrice?: string,
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
        "*, owner:users!owner_id(id, full_name, avatar_url, username), categories:agent_categories(category:categories(id, name, icon)), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)",
        selectOpts
      )
      .eq("visibility", "public")

    if (platform) {
      query = query.eq("manifest->>platform", platform)
    }

    if (search) {
      query = query.textSearch("search_vector", search, {
        type: "websearch",
        config: "english",
      })
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
          return { agents: [], totalCount: 0 }
        }
      } else {
        return { agents: [], totalCount: 0 }
      }
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

    if (minPrice) {
      const min = parseInt(minPrice, 10)
      if (!isNaN(min)) query = query.gte("price_cents", min)
    }
    if (maxPrice) {
      const max = parseInt(maxPrice, 10)
      if (!isNaN(max)) query = query.lte("price_cents", max)
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
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username), categories:agent_categories(category:categories(id, name, icon)), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)")
    .eq("featured", true)
    .eq("visibility", "public")
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
      remixed_from: data.remixed_from ?? null,
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
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username), categories:agent_categories(category:categories(id, name, icon)), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)")
    .eq("owner_id", owner.id)
    .order("stars_count", { ascending: false })

  if (error) {
    console.error("Error fetching user agents:", error)
    return []
  }

  await hydrateRemixSource(db, data ?? [])

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
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username), categories:agent_categories(category:categories(id, name, icon)), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching my agents:", error)
    return []
  }

  await hydrateRemixSource(db, data ?? [])

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
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username), categories:agent_categories(category:categories(id, name, icon)), tags:agent_tags(tag:tags(id, name)), resources:agent_resources(id, url, type, sort_order)")
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

export async function remixAgent(agentId: string) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const accessGranted = await hasAgentAccess(agentId)
  if (!accessGranted) return { error: "Access required. Please get the agent first." }

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

  const { data: originalFiles } = await db
    .from("agent_files")
    .select("path, content, content_hash, storage_url")
    .eq("agent_id", agentId)

  if (originalFiles && originalFiles.length > 0) {
    const remixFiles = originalFiles.map((f: any) => ({
      agent_id: remix.id,
      path: f.path,
      content: f.content,
      content_hash: f.content_hash,
      storage_url: f.storage_url,
    }))
    await db.from("agent_files").insert(remixFiles)
  }

  await db.rpc("increment_remix_count", { p_agent_id: agentId })
  revalidatePath("/")

  return { success: true, agent: remix }
}

export async function incrementInstallCount(agentId: string) {
  const db = await createClient()
  await db.rpc("increment_install_count", { p_agent_id: agentId })
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

  const { data: agent } = await db
    .from("agents")
    .select("price_cents")
    .eq("id", agentId)
    .single()

  if (!agent) return { error: "Agent not found" }

  if ((agent.price_cents ?? 0) > 0) {
    return { error: "This is a paid agent. Please purchase through checkout." }
  }

  const { error } = await db.from("agent_access").insert({
    user_id: user.id,
    agent_id: agentId,
    price_cents_at_acquisition: 0,
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

export const getAgentFiles = cache(async (agentId: string) => {
  const db = await createClient()
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
  const db = await createClient()
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

export async function deleteAgent(
  agentId: string,
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error: filesError } = await db
    .from("agent_files")
    .delete()
    .eq("agent_id", agentId)

  if (filesError) {
    console.error("Error deleting agent files:", filesError)
    return { error: filesError.message }
  }

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

export async function updateAgentPrice(
  agentId: string,
  priceCents: number,
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  if (priceCents !== 0 && priceCents < 500) {
    return { error: "Minimum price is $5.00. Set to $0 for free." }
  }

  if (priceCents > 0) {
    const { data: profile } = await db
      .from("users")
      .select("stripe_payouts_enabled")
      .eq("id", user.id)
      .single()

    if (!profile?.stripe_payouts_enabled) {
      return {
        error:
          "Connect a Stripe account in Settings before setting a paid price.",
      }
    }
  }

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

// ============================================================
// Publishing actions
// ============================================================

export interface PublishValidation {
  readme: boolean
  profileImage: boolean
  resources: boolean
  license: boolean
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
    .select("readme, profile_image_url, license, price_cents")
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
  const isFree = (agent?.price_cents ?? 0) === 0

  return {
    readme: !!agent?.readme && agent.readme.trim().length > 50,
    profileImage: isFree ? true : !!agent?.profile_image_url,
    resources: isFree ? true : rc >= 3,
    license: !!agent?.license,
    tags: (tagCount ?? 0) >= 1,
    resourceCount: rc,
    isFree,
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
  if (!validation.profileImage) errors.push("Profile image is required")
  if (!validation.resources) errors.push(`At least 3 resources required (${validation.resourceCount}/3)`)
  if (!validation.license) errors.push("License must be selected")
  if (!validation.tags) errors.push("At least 1 tag is required")

  const { data: agentData } = await db
    .from("agents")
    .select("price_cents, license")
    .eq("id", agentId)
    .single()

  if (agentData?.license) {
    const isFree = (agentData.price_cents ?? 0) === 0
    if (isFree && isPaidLicense(agentData.license as AgentLicense)) {
      errors.push("Free agents cannot use a commercial license (Proprietary/Custom)")
    }
    if (!isFree && isFreeLicense(agentData.license as AgentLicense)) {
      errors.push("Paid agents cannot use an open-source license (MIT, Apache, GPL, BSD)")
    }
  }

  if (errors.length > 0) {
    return { error: errors.join(". "), validation }
  }

  const { error } = await db
    .from("agents")
    .update({
      visibility: "public" as AgentVisibility,
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

  const { error } = await db
    .from("agents")
    .update({ visibility: "private" as AgentVisibility })
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

  const update: Record<string, string> = {}
  if (fields.name !== undefined) {
    const trimmed = fields.name.trim()
    if (!trimmed) return { error: "Name cannot be empty" }
    if (trimmed.length > 100) return { error: "Name must be 100 characters or fewer" }
    update.name = trimmed
  }
  if (fields.description !== undefined) {
    if (fields.description.length > 500)
      return { error: "Description must be 500 characters or fewer" }
    update.description = fields.description.trim()
  }

  if (Object.keys(update).length === 0) return { error: "Nothing to update" }

  const { error } = await db
    .from("agents")
    .update(update)
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

export async function updateAgentLicense(
  agentId: string,
  license: AgentLicense | null,
  profileUsername: string
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await db
    .from("agents")
    .update({ license })
    .eq("id", agentId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("Error updating agent license:", error)
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
