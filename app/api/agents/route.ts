import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { authenticateRequest } from "@/lib/auth/cli-auth"

// GET /api/agents - list agents
export async function GET(request: Request) {
  const db = createClient()
  const url = new URL(request.url)
  const search = url.searchParams.get("search")
  const username = url.searchParams.get("username")

  let query = db
    .from("agents")
    .select("*, owner:users!owner_id(id, full_name, avatar_url, username)")
    .eq("visibility", "public")

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`
    )
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
  const { slug, name, description, readme, manifest, cover_image_url, demo_video_url } =
    body

  if (!slug || !name) {
    return NextResponse.json(
      { error: "slug and name are required" },
      { status: 400 }
    )
  }

  const { data: existing } = await adminDb
    .from("agents")
    .select("id")
    .eq("owner_id", userId)
    .eq("slug", slug)
    .maybeSingle()

  if (existing) {
    const { data, error } = await adminDb
      .from("agents")
      .update({
        name,
        description: description ?? "",
        readme: readme ?? "",
        manifest: manifest ?? {},
        cover_image_url,
        demo_video_url,
      })
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
