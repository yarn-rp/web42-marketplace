import { createHash } from "crypto"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { AgentSnapshot } from "@/lib/types"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex")
}

export function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {}
      for (const k of Object.keys(value).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k]
      }
      return sorted
    }
    return value
  })
}

export function computeHashFromSnapshot(snapshot: AgentSnapshot): string {
  const parts = [
    canonicalJson(snapshot.identity),
    snapshot.readme,
    canonicalJson(snapshot.manifest),
    canonicalJson(snapshot.marketplace),
    snapshot.avatar_url ?? "",
    canonicalJson(
      snapshot.resources
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((r) => ({
          description: r.description,
          sort_order: r.sort_order,
          thumbnail_url: r.thumbnail_url,
          title: r.title,
          type: r.type,
          url: r.url,
        }))
    ),
    snapshot.files
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((f) => f.content_hash)
      .join("|"),
  ]
  return sha256(parts.join("\x00"))
}

export async function fetchAgentSnapshot(
  agentId: string
): Promise<{ snapshot: AgentSnapshot; updated_at: string } | null> {
  const { data: agent, error: agentError } = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single()

  if (agentError || !agent) return null

  const { data: tagRows } = await supabaseAdmin
    .from("agent_tags")
    .select("tag:tags(name)")
    .eq("agent_id", agentId)

  const tags: string[] = (tagRows ?? [])
    .map((r: any) => r.tag?.name)
    .filter(Boolean)
    .sort()

  const { data: resourceRows } = await supabaseAdmin
    .from("agent_resources")
    .select("title, description, type, url, thumbnail_url, sort_order")
    .eq("agent_id", agentId)
    .order("sort_order", { ascending: true })

  const { data: fileRows } = await supabaseAdmin
    .from("agent_files")
    .select("path, content, content_hash")
    .eq("agent_id", agentId)
    .order("path", { ascending: true })

  const snapshot: AgentSnapshot = {
    identity: {
      name: agent.name,
      slug: agent.slug,
      description: agent.description ?? "",
    },
    readme: agent.readme ?? "",
    manifest: (agent.manifest as Record<string, unknown>) ?? {},
    marketplace: {
      price_cents: agent.price_cents ?? 0,
      currency: agent.currency ?? "usd",
      license: agent.license ?? null,
      visibility: agent.visibility ?? "private",
      tags,
    },
    avatar_url: agent.profile_image_url ?? null,
    resources: (resourceRows ?? []).map((r: any) => ({
      title: r.title,
      description: r.description ?? null,
      type: r.type,
      url: r.url,
      thumbnail_url: r.thumbnail_url ?? null,
      sort_order: r.sort_order,
    })),
    files: (fileRows ?? []).map((f: any) => ({
      path: f.path,
      content: f.content ?? null,
      content_hash: f.content_hash,
    })),
  }

  return { snapshot, updated_at: agent.updated_at }
}

export async function computeAgentHash(agentId: string): Promise<{
  hash: string
  updated_at: string
  snapshot: AgentSnapshot
} | null> {
  const result = await fetchAgentSnapshot(agentId)
  if (!result) return null

  const hash = computeHashFromSnapshot(result.snapshot)
  return { hash, updated_at: result.updated_at, snapshot: result.snapshot }
}
