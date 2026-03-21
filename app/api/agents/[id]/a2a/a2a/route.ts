import { createClient } from "@/db/supabase/server"
import { authenticateRequest } from "@/lib/auth/cli-auth"

// GET /api/agents/:slug/a2a
// Public — returns live agent info for discovery
export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params
  const db = await createClient()

  const { data, error } = await db
    .from("agents")
    .select("a2a_url, a2a_enabled, gateway_status")
    .eq("slug", slug)
    .single()

  if (error || !data) {
    return Response.json({ error: "Agent not found" }, { status: 404 })
  }

  return Response.json(data)
}

// POST /api/agents/:slug/a2a
// Authenticated (publisher only) — registers live URL
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params

  const authResult = await authenticateRequest(request)
  if (!authResult) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const db = await createClient()

  // Verify ownership
  const { data: agent } = await db
    .from("agents")
    .select("owner_id")
    .eq("slug", slug)
    .single()

  if (!agent || agent.owner_id !== authResult.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await db
    .from("agents")
    .update({
      a2a_url: body.a2a_url,
      a2a_enabled: body.a2a_enabled ?? true,
      gateway_status: body.gateway_status ?? "live",
      last_seen_at: new Date().toISOString(),
    })
    .eq("slug", slug)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
