import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/agents/[id]/remix - create a remix of an agent
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: hasAccess } = await supabaseAdmin.rpc("has_agent_access", {
    p_user_id: user.id,
    p_agent_id: params.id,
  })

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Access required. Please get the agent first." },
      { status: 403 }
    )
  }

  const { data: original, error: fetchError } = await db
    .from("agents")
    .select("*")
    .eq("id", params.id)
    .single()

  if (fetchError || !original) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
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
      remixed_from_id: params.id,
    })
    .select("*, owner:users!owner_id(username)")
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You already have an agent with this slug" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Increment remix count on original
  await db.rpc("increment_remix_count", { p_agent_id: params.id })

  return NextResponse.json({ agent: remix }, { status: 201 })
}
