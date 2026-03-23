import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { authenticateRequest } from "@/lib/auth/cli-auth"
import type { AgentCardJSON, AgentExtension } from "@/lib/agent-card-utils"
import type { MarketplaceExtensionParams } from "@/lib/agent-card-utils"

async function generateQueryEmbedding(query: string): Promise<number[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured")
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  })

  if (!res.ok) {
    const body = (await res.json()) as { error?: { message?: string } }
    throw new Error(
      `OpenAI embeddings API error ${res.status}: ${body.error?.message ?? "unknown"}`
    )
  }

  const body = (await res.json()) as { data: Array<{ embedding: number[] }> }
  return body.data[0].embedding
}

export const dynamic = "force-dynamic"

interface AgentUpsertFields {
  agent_card: AgentCardJSON
  a2a_url: string
  profile_image_url: string | null
  slug?: string
}

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const db = await createClient()
  const url = new URL(request.url)
  const search = url.searchParams.get("search")
  const mode = url.searchParams.get("mode")           // "hybrid" | "keyword" | absent
  const username = url.searchParams.get("username")
  const tags = url.searchParams.get("tags")           // comma-separated
  const categories = url.searchParams.get("categories") // comma-separated

  // Hybrid search: search param present AND mode=hybrid
  if (search && mode === "hybrid") {
    let embedding: number[]
    try {
      embedding = await generateQueryEmbedding(search)
    } catch (err) {
      console.error("[api/agents GET] Failed to generate query embedding:", err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to generate embedding" },
        { status: 502 }
      )
    }

    const adminDb = getSupabaseAdmin()
    const { data, error } = await adminDb.rpc("search_agents_hybrid", {
      query_text: search,
      query_embedding: JSON.stringify(embedding),
      match_count: 20,
    })

    if (error) {
      console.error("[api/agents GET] Hybrid search RPC error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }

  // Keyword search (default) and all other list queries
  const auth = await authenticateRequest(request).catch(() => null)

  let isOwnerRequest = false
  let targetUser: { id: string } | null = null

  if (username && auth) {
    const result = await db
      .from("users")
      .select("id")
      .eq("username", username)
      .single()

    targetUser = result.data

    if (targetUser && targetUser.id === auth.userId) {
      isOwnerRequest = true
    }
  }

  const queryClient = isOwnerRequest ? getSupabaseAdmin() : db

  let query = queryClient
    .from("agents")
    .select(
      "id, slug, agent_card, readme, profile_image_url, a2a_url, owner_id, stars_count, interactions_count, approved, featured, published_at, created_at, updated_at, gateway_status, owner:users!owner_id(id, full_name, avatar_url, username)"
    )

  if (username) {
    if (targetUser) {
      query = query.eq("owner_id", targetUser.id)
    }
  }

  // For non-owner requests, always filter to public agents only.
  // visibility lives in agent_card JSONB (not a column — dropped in migration 20260322010000).
  if (!isOwnerRequest) {
    query = query.filter(
      "agent_card->capabilities->extensions",
      "cs",
      JSON.stringify([
        {
          uri: "https://web42.ai/ext/marketplace/v1",
          params: { visibility: "public" },
        },
      ])
    )
  }

  if (search) {
    query = query.textSearch("search_vector", search, {
      type: "websearch",
      config: "english",
    })
  }

  // Tag filtering: each tag must be present in the marketplace extension params
  if (tags) {
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean)
    for (const tag of tagList) {
      query = query.filter(
        "agent_card->capabilities->extensions",
        "cs",
        JSON.stringify([
          {
            uri: "https://web42.ai/ext/marketplace/v1",
            params: { tags: [tag] },
          },
        ])
      )
    }
  }

  // Category filtering: each category must be present in the marketplace extension params
  if (categories) {
    const catList = categories.split(",").map((c) => c.trim()).filter(Boolean)
    for (const cat of catList) {
      query = query.filter(
        "agent_card->capabilities->extensions",
        "cs",
        JSON.stringify([
          {
            uri: "https://web42.ai/ext/marketplace/v1",
            params: { categories: [cat] },
          },
        ])
      )
    }
  }

  // "live" > "offline" alphabetically, so descending puts live agents first
  query = query
    .order("gateway_status", { ascending: false })
    .order("stars_count", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("[api/agents GET] DB error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    url: agentUrl,
    slug: explicitSlug,
    price_cents,
    currency,
    license,
    visibility,
    categories: bodyCategories,
    tags: bodyTags,
    profile_image_url,
  } = body as {
    url: string
    slug?: string
    price_cents?: number
    currency?: string
    license?: string
    visibility?: string
    categories?: string[]
    tags?: string[]
    profile_image_url?: string
  }

  if (!agentUrl) {
    return NextResponse.json(
      { error: "url is required (the agent's base URL)" },
      { status: 400 }
    )
  }

  // Fetch the agent card from the remote URL
  const cardUrl = `${agentUrl.replace(/\/$/, "")}/.well-known/agent-card.json`
  let agentCard: AgentCardJSON
  try {
    const cardRes = await fetch(cardUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    })
    if (!cardRes.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch agent card: ${cardRes.status} ${cardRes.statusText}`,
        },
        { status: 400 }
      )
    }
    try {
      agentCard = (await cardRes.json()) as AgentCardJSON
    } catch (parseErr) {
      if (parseErr instanceof SyntaxError) {
        return NextResponse.json(
          {
            error:
              "Agent returned invalid JSON — make sure /.well-known/agent.json is valid JSON",
          },
          { status: 400 }
        )
      }
      throw parseErr
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: `Network error fetching agent card from ${cardUrl}: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 400 }
    )
  }

  // Merge Web42 marketplace extension into capabilities.extensions[]
  const marketplaceParams: MarketplaceExtensionParams = {}
  if (price_cents !== undefined) marketplaceParams.price_cents = price_cents
  if (currency) marketplaceParams.currency = currency
  if (license) marketplaceParams.license = license
  if (visibility) marketplaceParams.visibility = visibility
  if (bodyCategories) marketplaceParams.categories = bodyCategories
  if (bodyTags) marketplaceParams.tags = bodyTags

  if (Object.keys(marketplaceParams).length > 0) {
    const caps = agentCard.capabilities ?? {}
    const extensions: AgentExtension[] = caps.extensions ?? []

    const existingIdx = extensions.findIndex(
      (e) => e.uri === "https://web42.ai/ext/marketplace/v1"
    )
    const ext: AgentExtension = {
      uri: "https://web42.ai/ext/marketplace/v1",
      description: "Web42 marketplace listing metadata",
      required: false,
      params: marketplaceParams as Record<string, unknown>,
    }

    if (existingIdx >= 0) {
      extensions[existingIdx] = ext
    } else {
      extensions.push(ext)
    }

    agentCard = { ...agentCard, capabilities: { ...caps, extensions } }
  }

  const adminDb = getSupabaseAdmin()

  // Fetch owner username for slug
  const { data: ownerProfile } = await adminDb
    .from("users")
    .select("username")
    .eq("id", auth.userId)
    .single()

  const ownerUsername = ownerProfile?.username
  if (!ownerUsername) {
    return NextResponse.json(
      { error: "Could not resolve your username" },
      { status: 400 }
    )
  }

  const cardName = agentCard.name ?? "Untitled"
  const agentSlugPart =
    explicitSlug ??
    cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const slug = `@${ownerUsername}~${agentSlugPart}`

  // Try to find existing record by slug first (normal case)
  const { data: existingBySlug } = await adminDb
    .from("agents")
    .select("id")
    .eq("owner_id", auth.userId)
    .eq("slug", slug)
    .maybeSingle()

  // If not found by slug, try by a2a_url (handles re-registration after rename)
  let existing: { id: string; slug?: string } | null = existingBySlug
  if (!existing) {
    const { data: existingByUrl } = await adminDb
      .from("agents")
      .select("id, slug")
      .eq("owner_id", auth.userId)
      .eq("a2a_url", agentUrl)
      .maybeSingle()
    existing = existingByUrl
  }

  const agentFields: AgentUpsertFields = {
    agent_card: agentCard,
    a2a_url: agentUrl,
    profile_image_url: profile_image_url ?? agentCard.iconUrl ?? null,
  }

  // If found by URL and the slug has changed, update slug too
  if (existing && existing.slug !== undefined && existing.slug !== slug) {
    agentFields.slug = slug
  }

  let agentId: string
  let isCreated = false

  if (existing) {
    const { data, error } = await adminDb
      .from("agents")
      .update(agentFields)
      .eq("id", existing.id)
      .select("id")
      .single()

    if (error) {
      console.error("[api/agents POST] DB update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    agentId = data.id
  } else {
    const { data, error } = await adminDb
      .from("agents")
      .insert({
        slug,
        owner_id: auth.userId,
        published_at: new Date().toISOString(),
        ...agentFields,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[api/agents POST] DB insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    agentId = data.id
    isCreated = true
  }

  const { data: agentData, error: fetchError } = await adminDb
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single()

  if (fetchError) {
    console.error("[api/agents POST] DB fetch error:", fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      agent: agentData,
      ...(isCreated ? { created: true } : { updated: true }),
    },
    { status: isCreated ? 201 : 200 }
  )
}
