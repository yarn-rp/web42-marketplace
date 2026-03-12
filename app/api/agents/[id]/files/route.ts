import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { authenticateRequest } from "@/lib/auth/cli-auth"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/agents/[id]/files - get file manifest (optionally with content)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = await createClient()
  const url = new URL(request.url)
  const includeContent = url.searchParams.get("include_content") === "true"

  if (includeContent) {
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: hasAccess } = await supabaseAdmin.rpc("has_agent_access", {
      p_user_id: auth.userId,
      p_agent_id: params.id,
    })

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access required. Please get the agent first." },
        { status: 403 }
      )
    }
  }

  const selectFields = includeContent
    ? "*"
    : "id, agent_id, version_id, path, content_hash, storage_url, created_at"

  const { data: files, error } = await db
    .from("agent_files")
    .select(selectFields)
    .eq("agent_id", params.id)
    .order("path")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(files)
}

// POST /api/agents/[id]/files - upload file metadata + content (CLI push)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("owner_id")
    .eq("id", params.id)
    .single()

  if (!agent || agent.owner_id !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { files } = body as {
    files: Array<{
      path: string
      content: string
      content_hash: string
      storage_url: string
      version_id?: string
    }>
  }

  if (!files || !Array.isArray(files)) {
    return NextResponse.json(
      { error: "files array is required" },
      { status: 400 }
    )
  }

  await supabaseAdmin.from("agent_files").delete().eq("agent_id", params.id)

  const inserts = files.map((f) => ({
    agent_id: params.id,
    path: f.path,
    content: f.content ?? null,
    content_hash: f.content_hash,
    storage_url: f.storage_url,
    version_id: f.version_id ?? null,
  }))

  const { data, error } = await supabaseAdmin
    .from("agent_files")
    .insert(inserts)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ files: data }, { status: 201 })
}
