// generate-agent-embedding
// Triggered by a Supabase DB webhook on agents INSERT or UPDATE.
// Builds a text representation of the agent, calls OpenAI
// text-embedding-3-small, and stores the resulting vector on the row.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface AgentSkillCard {
  name: string
  description: string
  tags?: string[]
  examples?: string[]
}

interface AgentCardJSON {
  name?: string
  description?: string
  skills?: AgentSkillCard[]
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  record: {
    id: string
    agent_card: AgentCardJSON
  }
  old_record?: unknown
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[]
  }>
  error?: {
    message: string
  }
}

function buildEmbeddingInput(agentCard: AgentCardJSON): string {
  const name = agentCard.name ?? ""
  const description = agentCard.description ?? ""
  const skills = agentCard.skills ?? []

  const skillParts = skills.map((skill) => {
    let part = `${skill.name}: ${skill.description}`
    if (skill.examples && skill.examples.length > 0) {
      part += `. Examples: ${skill.examples.join(". ")}`
    }
    if (skill.tags && skill.tags.length > 0) {
      part += `. Tags: ${skill.tags.join(", ")}`
    }
    return part
  })

  const parts: string[] = [`${name}. ${description}`]
  if (skillParts.length > 0) {
    parts.push(`Skills: ${skillParts.join(". ")}`)
  }

  return parts.join(". ")
}

Deno.serve(async (req: Request): Promise<Response> => {
  console.log("[generate-agent-embedding] Request received", {
    method: req.method,
    url: req.url,
  })

  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  if (!openaiApiKey) {
    console.error("[generate-agent-embedding] OPENAI_API_KEY not set")
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY env var is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  let payload: WebhookPayload
  try {
    payload = (await req.json()) as WebhookPayload
  } catch (err) {
    console.error("[generate-agent-embedding] Failed to parse request body", err)
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const { type, record } = payload

  if (type === "DELETE") {
    console.log("[generate-agent-embedding] DELETE event — nothing to do")
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!record?.id || !record?.agent_card) {
    console.error("[generate-agent-embedding] Missing record.id or record.agent_card", { payload })
    return new Response(
      JSON.stringify({ error: "Missing record fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const agentId = record.id
  const agentCard = record.agent_card

  const input = buildEmbeddingInput(agentCard)
  console.log("[generate-agent-embedding] Embedding input built", {
    agentId,
    inputLength: input.length,
  })

  // Call OpenAI text-embedding-3-small
  let embedding: number[]
  try {
    const openaiRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input,
      }),
    })

    const openaiBody = (await openaiRes.json()) as OpenAIEmbeddingResponse

    if (!openaiRes.ok) {
      console.error("[generate-agent-embedding] OpenAI API error", {
        status: openaiRes.status,
        body: openaiBody,
      })
      return new Response(
        JSON.stringify({ error: openaiBody.error?.message ?? "OpenAI API error" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      )
    }

    embedding = openaiBody.data[0].embedding
    console.log("[generate-agent-embedding] Embedding received", {
      agentId,
      dimensions: embedding.length,
    })
  } catch (err) {
    console.error("[generate-agent-embedding] Network error calling OpenAI", err)
    return new Response(
      JSON.stringify({ error: "Failed to reach OpenAI API" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }

  // Persist the embedding vector back to the agents table
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[generate-agent-embedding] Supabase env vars not set")
    return new Response(
      JSON.stringify({ error: "Supabase env vars are not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const db = createClient(supabaseUrl, supabaseServiceKey)

  const { error: updateError } = await db
    .from("agents")
    .update({ embedding: JSON.stringify(embedding) })
    .eq("id", agentId)

  if (updateError) {
    console.error("[generate-agent-embedding] DB update error", {
      agentId,
      error: updateError,
    })
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  console.log("[generate-agent-embedding] Embedding saved", { agentId })

  return new Response(
    JSON.stringify({ ok: true, agentId, dimensions: embedding.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  )
})
