import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { authenticateRequest } from "@/lib/auth/cli-auth"
import { computeAgentHash } from "@/lib/sync/agent-sync"
import type { AgentSnapshot } from "@/lib/types"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

async function upsertTags(
  agentId: string,
  tagNames: string[]
): Promise<void> {
  await supabaseAdmin.from("agent_tags").delete().eq("agent_id", agentId)

  if (tagNames.length === 0) return

  const tagIds: string[] = []
  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) continue

    const { data: existing } = await supabaseAdmin
      .from("tags")
      .select("id")
      .ilike("name", trimmed)
      .maybeSingle()

    if (existing) {
      tagIds.push(existing.id)
    } else {
      const { data: created } = await supabaseAdmin
        .from("tags")
        .insert({ name: trimmed })
        .select("id")
        .single()

      if (created) tagIds.push(created.id)
    }
  }

  if (tagIds.length > 0) {
    await supabaseAdmin
      .from("agent_tags")
      .insert(tagIds.map((tagId) => ({ agent_id: agentId, tag_id: tagId })))
  }
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

  let body: AgentSnapshot
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const agentUpdate: Record<string, unknown> = {}

  if (body.identity) {
    if (body.identity.name) agentUpdate.name = body.identity.name
    if (body.identity.description !== undefined)
      agentUpdate.description = body.identity.description
    agentUpdate.slug = slugify(body.identity.name || "")
  }

  if (body.readme !== undefined) {
    agentUpdate.readme = body.readme
  }

  if (body.manifest !== undefined) {
    agentUpdate.manifest = body.manifest
    if (!agentUpdate.name && body.manifest.name) {
      agentUpdate.name = body.manifest.name as string
    }
    if (!agentUpdate.description && body.manifest.description) {
      agentUpdate.description = body.manifest.description as string
    }
  }

  if (body.marketplace) {
    if (body.marketplace.price_cents !== undefined)
      agentUpdate.price_cents = body.marketplace.price_cents
    if (body.marketplace.currency !== undefined)
      agentUpdate.currency = body.marketplace.currency
    if (body.marketplace.license !== undefined)
      agentUpdate.license = body.marketplace.license
    if (body.marketplace.visibility !== undefined)
      agentUpdate.visibility = body.marketplace.visibility
  }

  if (Object.keys(agentUpdate).length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("agents")
      .update(agentUpdate)
      .eq("id", agentId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }
  }

  if (body.marketplace?.tags) {
    await upsertTags(agentId, body.marketplace.tags)
  }

  if (body.files && Array.isArray(body.files)) {
    await supabaseAdmin.from("agent_files").delete().eq("agent_id", agentId)

    if (body.files.length > 0) {
      const inserts = body.files.map((f) => ({
        agent_id: agentId,
        path: f.path,
        content: f.content,
        content_hash: f.content_hash,
        storage_url: `agent-files/${agentId}/${f.path}`,
      }))

      const { error: filesError } = await supabaseAdmin
        .from("agent_files")
        .insert(inserts)

      if (filesError) {
        return NextResponse.json(
          { error: filesError.message },
          { status: 500 }
        )
      }
    }
  }

  const result = await computeAgentHash(agentId)
  if (!result) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json({
    hash: result.hash,
    updated_at: result.updated_at,
  })
}
