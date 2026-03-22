import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { authenticateRequest } from "@/lib/auth/cli-auth"

export const dynamic = "force-dynamic"

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
  const username = url.searchParams.get("username")

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
      "id, slug, agent_card, readme, profile_image_url, a2a_url, owner_id, stars_count, interactions_count, approved, featured, published_at, created_at, updated_at, owner:users!owner_id(id, full_name, avatar_url, username)"
    )

  if (username) {
    if (targetUser) {
      query = query.eq("owner_id", targetUser.id)
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
    }
  }

  if (search) {
    query = query.textSearch("search_vector", search, {
      type: "websearch",
      config: "english",
    })
  }

  query = query.order("stars_count", { ascending: false })

  const { data, error } = await query

  if (error) {
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
    categories,
    tags,
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
  const cardUrl = `${agentUrl.replace(/\/$/, "")}/.well-known/agent.json`
  let agentCard: Record<string, unknown>
  try {
    const cardRes = await fetch(cardUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    })
    if (!cardRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch agent card: ${cardRes.status} ${cardRes.statusText}` },
        { status: 400 }
      )
    }
    agentCard = await cardRes.json()
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot reach agent at ${cardUrl}: ${String(err)}` },
      { status: 400 }
    )
  }

  // Merge Web42 marketplace extension into capabilities.extensions[]
  const marketplaceParams: Record<string, unknown> = {}
  if (price_cents !== undefined) marketplaceParams.price_cents = price_cents
  if (currency) marketplaceParams.currency = currency
  if (license) marketplaceParams.license = license
  if (visibility) marketplaceParams.visibility = visibility
  if (categories) marketplaceParams.categories = categories
  if (tags) marketplaceParams.tags = tags

  if (Object.keys(marketplaceParams).length > 0) {
    const caps = (agentCard.capabilities ?? {}) as Record<string, unknown>
    const extensions = (caps.extensions ?? []) as Array<Record<string, unknown>>

    const existingIdx = extensions.findIndex(
      (e) => e.uri === "https://web42.ai/ext/marketplace/v1"
    )
    const ext = {
      uri: "https://web42.ai/ext/marketplace/v1",
      description: "Web42 marketplace listing metadata",
      required: false,
      params: marketplaceParams,
    }

    if (existingIdx >= 0) {
      extensions[existingIdx] = ext
    } else {
      extensions.push(ext)
    }

    caps.extensions = extensions
    agentCard.capabilities = caps
  }

  const cardName = (agentCard.name as string) ?? "Untitled"
  const slug =
    explicitSlug ?? cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const adminDb = getSupabaseAdmin()

  const { data: existing } = await adminDb
    .from("agents")
    .select("id")
    .eq("owner_id", auth.userId)
    .eq("slug", slug)
    .maybeSingle()

  const agentFields = {
    agent_card: agentCard,
    a2a_url: agentUrl,
    profile_image_url: profile_image_url ?? (agentCard.iconUrl as string) ?? null,
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    agentId = data.id
  } else {
    const { data, error } = await adminDb
      .from("agents")
      .insert({
        slug,
        owner_id: auth.userId,
        ...agentFields,
      })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    agentId = data.id
    isCreated = true
  }

  const { data: agentData } = await adminDb
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single()

  return NextResponse.json(
    {
      agent: agentData,
      ...(isCreated ? { created: true } : { updated: true }),
    },
    { status: isCreated ? 201 : 200 }
  )
}
