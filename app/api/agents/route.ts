import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { authenticateRequest } from "@/lib/auth/cli-auth"
import { computeAgentHash } from "@/lib/sync/agent-sync"

// GET /api/agents - list agents
export async function GET(request: Request) {
  const db = await createClient()
  const url = new URL(request.url)
  const search = url.searchParams.get("search")
  const username = url.searchParams.get("username")

  let query = db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username)")
    .eq("visibility", "public")

  if (search) {
    query = query.textSearch("search_vector", search, {
      type: "websearch",
      config: "english",
    })
  }

  if (username) {
    const { data: user } = await db
      .from("users")
      .select("id")
      .eq("username", username)
      .single()
    if (user) {
      query = query.eq("owner_id", user.id)
    }
  }

  query = query.order("stars_count", { ascending: false })

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/agents - create or update an agent (used by CLI push)
export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = auth.userId

  const adminDb = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()
  const {
    slug,
    name,
    description,
    readme,
    manifest,
    cover_image_url,
    demo_video_url,
    price_cents,
    currency,
    license,
    visibility,
    tags,
  } = body

  if (!slug || !name) {
    return NextResponse.json(
      { error: "slug and name are required" },
      { status: 400 }
    )
  }

  if (manifest && !manifest.platform) {
    manifest.platform = "openclaw"
  }

  const agentFields: Record<string, unknown> = {
    name,
    description: description ?? "",
    readme: readme ?? "",
    manifest: manifest ?? {},
    cover_image_url,
    demo_video_url,
  }

  if (price_cents !== undefined) agentFields.price_cents = price_cents
  if (currency !== undefined) agentFields.currency = currency
  if (license !== undefined) agentFields.license = license
  if (visibility !== undefined) agentFields.visibility = visibility

  const { data: existing } = await adminDb
    .from("agents")
    .select("id")
    .eq("owner_id", userId)
    .eq("slug", slug)
    .maybeSingle()

  let agentId: string
  let isCreated = false

  if (existing) {
    const { data, error } = await adminDb
      .from("agents")
      .update(agentFields)
      .eq("id", existing.id)
      .select()
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
        owner_id: userId,
        visibility: "private",
        ...agentFields,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    agentId = data.id
    isCreated = true
  }

  if (Array.isArray(tags)) {
    await adminDb.from("agent_tags").delete().eq("agent_id", agentId)

    const tagIds: string[] = []
    for (const tagName of tags) {
      const trimmed = (tagName as string).trim().toLowerCase()
      if (!trimmed) continue

      const { data: existingTag } = await adminDb
        .from("tags")
        .select("id")
        .ilike("name", trimmed)
        .maybeSingle()

      if (existingTag) {
        tagIds.push(existingTag.id)
      } else {
        const { data: created } = await adminDb
          .from("tags")
          .insert({ name: trimmed })
          .select("id")
          .single()
        if (created) tagIds.push(created.id)
      }
    }

    if (tagIds.length > 0) {
      await adminDb
        .from("agent_tags")
        .insert(tagIds.map((tagId) => ({ agent_id: agentId, tag_id: tagId })))
    }
  }

  const syncResult = await computeAgentHash(agentId)

  const { data: agentData } = await adminDb
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single()

  return NextResponse.json(
    {
      agent: agentData,
      ...(isCreated ? { created: true } : { updated: true }),
      hash: syncResult?.hash ?? null,
    },
    { status: isCreated ? 201 : 200 }
  )
}
