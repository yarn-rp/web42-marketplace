import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { authenticateRequest } from "@/lib/auth/cli-auth"

// This route is used by the CLI push flow and uploads binary data (avatar PNG),
// which requires the Node.js runtime (Buffer).
export const runtime = "nodejs"

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

  const body = (await request.json()) as {
    slug?: string
    name?: string
    description?: string
    readme?: string
    manifest?: any
    cover_image_url?: string | null
    demo_video_url?: string | null
    // Base64-encoded PNG data (preferred for CLI push). Can also be a data URI.
    profile_image_data?: string
    // Optional direct URL if a client already uploaded the asset.
    profile_image_url?: string | null
  }

  const {
    slug,
    name,
    description,
    readme,
    manifest,
    cover_image_url,
    demo_video_url,
    profile_image_data,
    profile_image_url: profile_image_url_from_client,
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

  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "_")

  if (
    profile_image_url_from_client &&
    !/^https?:\/\//.test(profile_image_url_from_client)
  ) {
    return NextResponse.json(
      { error: "profile_image_url must be an http(s) URL" },
      { status: 400 }
    )
  }

  let profile_image_url: string | undefined =
    profile_image_url_from_client ?? undefined

  // If the client sends base64 image data, upload it to storage and override
  // any provided URL.
  if (profile_image_data) {
    let base64 = profile_image_data.trim()

    const dataUriMatch = base64.match(/^data:([^;]+);base64,(.*)$/)
    if (dataUriMatch) {
      const mime = dataUriMatch[1]
      if (mime !== "image/png") {
        return NextResponse.json(
          { error: `Unsupported profile image type: ${mime}` },
          { status: 400 }
        )
      }
      base64 = dataUriMatch[2]
    }

    let buffer: Buffer
    try {
      buffer = Buffer.from(base64, "base64")
    } catch {
      return NextResponse.json(
        { error: "Invalid profile_image_data" },
        { status: 400 }
      )
    }

    if (!buffer.length) {
      return NextResponse.json(
        { error: "Invalid profile_image_data" },
        { status: 400 }
      )
    }

    // Keep avatar payloads small; this endpoint is called from the CLI push.
    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Profile image too large (max 2MB)" },
        { status: 400 }
      )
    }

    const uploadPath = `${userId}/${safeSlug}/avatar.png`
    const { data: uploadData, error: uploadError } = await adminDb.storage
      .from("agent-covers")
      .upload(uploadPath, buffer, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("Error uploading agent profile image:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload agent profile image" },
        { status: 500 }
      )
    }

    const { data: publicUrl } = adminDb.storage
      .from("agent-covers")
      .getPublicUrl(uploadData.path)
    profile_image_url = publicUrl.publicUrl
  }

  const { data: existing } = await adminDb
    .from("agents")
    .select("id")
    .eq("owner_id", userId)
    .eq("slug", slug)
    .maybeSingle()

  if (existing) {
    const updateData: any = {
      name,
      description: description ?? "",
      readme: readme ?? "",
      manifest: manifest ?? {},
      cover_image_url,
      demo_video_url,
    }

    if (profile_image_url) {
      updateData.profile_image_url = profile_image_url
    }

    const { data, error } = await adminDb
      .from("agents")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ agent: data, updated: true })
  } else {
    const { data, error } = await adminDb
      .from("agents")
      .insert({
        slug,
        name,
        description: description ?? "",
        readme: readme ?? "",
        manifest: manifest ?? {},
        owner_id: userId,
        cover_image_url,
        demo_video_url,
        profile_image_url,
        visibility: "private",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ agent: data, created: true }, { status: 201 })
  }
}
