import { NextResponse } from "next/server"
import { createClient } from "@/db/supabase/server"

// POST /api/agents/[id]/install - increment install count and return agent + files with content
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const db = createClient()

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
    },
    files: agent.files,
  })
}
