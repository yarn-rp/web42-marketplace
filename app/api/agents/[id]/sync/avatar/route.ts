import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { authenticateRequest } from "@/lib/auth/cli-auth"
import { computeAgentHash } from "@/lib/sync/agent-sync"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
])

function extensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  }
  return map[mime] ?? "png"
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: agentId } = await params

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("owner_id")
    .eq("id", agentId)
    .single()

  if (!agent || agent.owner_id !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data" },
      { status: 400 }
    )
  }

  const file = formData.get("avatar")
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'avatar' file field" },
      { status: 400 }
    )
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type}. Allowed: png, jpeg, webp, svg` },
      { status: 400 }
    )
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Avatar file must be under 5 MB" },
      { status: 400 }
    )
  }

  const ext = extensionFromMime(file.type)
  const storagePath = `${agentId}/profile.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from("agent-covers")
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    )
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("agent-covers")
    .getPublicUrl(storagePath)

  const avatarUrl = urlData.publicUrl

  const { error: updateError } = await supabaseAdmin
    .from("agents")
    .update({ profile_image_url: avatarUrl })
    .eq("id", agentId)

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    )
  }

  const result = await computeAgentHash(agentId)

  return NextResponse.json({
    avatar_url: avatarUrl,
    hash: result?.hash ?? "",
    updated_at: result?.updated_at ?? "",
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: agentId } = await params

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("owner_id")
    .eq("id", agentId)
    .single()

  if (!agent || agent.owner_id !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error: updateError } = await supabaseAdmin
    .from("agents")
    .update({ profile_image_url: null })
    .eq("id", agentId)

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    )
  }

  const result = await computeAgentHash(agentId)

  return NextResponse.json({
    avatar_url: null,
    hash: result?.hash ?? "",
    updated_at: result?.updated_at ?? "",
  })
}
