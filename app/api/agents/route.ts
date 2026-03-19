import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { authenticateRequest } from "@/lib/auth/cli-auth"
import { computeAgentHash } from "@/lib/sync/agent-sync"

export const dynamic = "force-dynamic"

// GET /api/agents - list agents
export async function GET(request: Request) {
  const db = await createClient()
  const url = new URL(request.url)
  const search = url.searchParams.get("search")
  const username = url.searchParams.get("username")

  // Check if requester is authenticated (optional — unauthenticated requests still work)
  const auth = await authenticateRequest(request).catch(() => null)

  let isOwnerRequest = false
  let targetUser: { id: string } | null = null

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set — falling back to public client")
    isOwnerRequest = false
  }

  // When the owner requests their own agents, use the admin client to bypass
  // RLS (which filters out private/unlisted agents at the DB level).

  if (username && auth) {
    // Fetch once only
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

  const queryClient = isOwnerRequest
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    : db

  let query = queryClient
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username)")

  if (username) {
    if (targetUser) {
      query = query.eq("owner_id", targetUser.id)
      // Non-owner requests: only show public
      if (!isOwnerRequest) {
        query = query.eq("visibility", "public")
      }
    }
  } else {
    // No username filter — only public
    query = query.eq("visibility", "public")
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
    profile_image_data,
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

  // Fields that the CLI can always update
  const agentFields: Record<string, unknown> = {
    name,
    description: description ?? "",
    readme: readme ?? "",
    manifest: manifest ?? {},
    cover_image_url,
    demo_video_url,
  }

  // Marketplace-sensitive fields (price, currency, license, visibility)
  // are ONLY set on create. Updates to these must go through the dashboard UI.
  const createOnlyFields: Record<string, unknown> = {}
  if (price_cents !== undefined) createOnlyFields.price_cents = price_cents
  if (currency !== undefined) createOnlyFields.currency = currency
  if (license !== undefined) createOnlyFields.license = license
  if (visibility !== undefined) createOnlyFields.visibility = visibility

  if (profile_image_data) {
    try {
      let base64 = profile_image_data.trim()
      const dataUriMatch = base64.match(/^data:([^;]+);base64,(.*)$/)
      if (dataUriMatch) {
        base64 = dataUriMatch[2]
      }

      const buffer = Buffer.from(base64, "base64")
      if (buffer.length > 0 && buffer.length <= 2 * 1024 * 1024) {
        const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "_")
        const { data: uploadData, error: uploadError } = await adminDb.storage
          .from("agent-covers")
          .upload(`${userId}/${safeSlug}/avatar.png`, buffer, {
            contentType: "image/png",
            upsert: true,
          })

        if (!uploadError) {
          const { data: publicUrl } = adminDb.storage
            .from("agent-covers")
            .getPublicUrl(uploadData.path)
          agentFields.profile_image_url = publicUrl.publicUrl
        }
      }
    } catch (e) {
      console.error("Error processing profile image data:", e)
    }
  }

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
        ...createOnlyFields,
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
