import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { authenticateRequest } from "@/lib/auth/cli-auth"
import { computeAgentHash } from "@/lib/sync/agent-sync"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ResourceMeta {
  file_key: string
  title: string
  description?: string
  type: "video" | "image" | "document"
  sort_order?: number
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const metadataField = formData.get("metadata")
  if (!metadataField || typeof metadataField !== "string") {
    return NextResponse.json(
      { error: "Missing 'metadata' JSON field" },
      { status: 400 }
    )
  }

  let metadata: ResourceMeta[]
  try {
    metadata = JSON.parse(metadataField)
    if (!Array.isArray(metadata)) throw new Error("metadata must be an array")
  } catch (e: any) {
    return NextResponse.json(
      { error: `Invalid metadata JSON: ${e.message}` },
      { status: 400 }
    )
  }

  await supabaseAdmin
    .from("agent_resources")
    .delete()
    .eq("agent_id", agentId)

  const insertedResources: Array<Record<string, unknown>> = []

  for (let i = 0; i < metadata.length; i++) {
    const meta = metadata[i]
    const file = formData.get(meta.file_key)

    let url: string
    let thumbnailUrl: string | null = null

    if (file && file instanceof File) {
      const ext = file.name.split(".").pop() ?? "bin"
      const storagePath = `${agentId}/${meta.file_key}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabaseAdmin.storage
        .from("agent-resources")
        .upload(storagePath, buffer, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed for ${meta.file_key}: ${uploadError.message}` },
          { status: 500 }
        )
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("agent-resources")
        .getPublicUrl(storagePath)

      url = urlData.publicUrl
      if (meta.type === "image") thumbnailUrl = url
    } else {
      continue
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("agent_resources")
      .insert({
        agent_id: agentId,
        title: meta.title,
        description: meta.description ?? "",
        type: meta.type,
        url,
        thumbnail_url: thumbnailUrl,
        sort_order: meta.sort_order ?? i,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    insertedResources.push(inserted)
  }

  const result = await computeAgentHash(agentId)

  return NextResponse.json({
    resources: insertedResources,
    hash: result?.hash ?? "",
    updated_at: result?.updated_at ?? "",
  })
}
