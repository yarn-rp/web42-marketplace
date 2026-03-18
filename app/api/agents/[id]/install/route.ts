import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { authenticateRequest } from "@/lib/auth/cli-auth"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/agents/[id]/install - increment install count and return agent + files with content
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const db = await createClient()

  await db.rpc("increment_install_count", { p_agent_id: params.id })

  const { data: agent, error: agentError } = await db
    .from("agents")
    .select(
      "*, owner:users!owner_id(username), files:agent_files(*)"
    )
    .eq("id", params.id)
    .single()

  if (agentError || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json({
    agent: {
      id: agent.id,
      slug: agent.slug,
      name: agent.name,
      manifest: agent.manifest,
      owner: agent.owner,
      profile_image_url: agent.profile_image_url ?? null,
    },
    files: agent.files,
  })
}
