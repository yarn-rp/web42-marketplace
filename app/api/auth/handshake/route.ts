import { NextResponse } from "next/server"
import { SignJWT, importPKCS8 } from "jose"
import { authenticateRequest, getSupabaseAdmin } from "@/lib/auth/cli-auth"

const ALG = "RS256"
const TOKEN_TTL_SECONDS = 15 * 60 // 15 minutes

async function getPrivateKey() {
  const pem = process.env.JWT_PRIVATE_KEY
  if (!pem) throw new Error("JWT_PRIVATE_KEY env var is not set")
  return importPKCS8(pem, ALG)
}

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let agentSlug: string
  try {
    const body = (await request.json()) as { agentSlug?: string }
    agentSlug = body.agentSlug ?? ""
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  if (!agentSlug) {
    return NextResponse.json(
      { error: "agentSlug is required" },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, slug, a2a_url, owner_id, agent_card")
    .eq("slug", agentSlug)
    .single()

  if (agentError || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  if (!agent.a2a_url) {
    return NextResponse.json(
      { error: "Agent has no A2A URL configured" },
      { status: 400 }
    )
  }

  // Check access: owner, free, or purchased
  const isOwner = agent.owner_id === auth.userId
  const priceCents =
    agent.agent_card?.capabilities?.extensions?.find(
      (ext: { uri: string }) => ext.uri === "https://web42.ai/ext/marketplace/v1"
    )?.params?.price_cents ?? 0

  if (!isOwner && priceCents > 0) {
    const { data: access } = await supabase
      .from("agent_access")
      .select("user_id")
      .eq("user_id", auth.userId)
      .eq("agent_id", agent.id)
      .single()

    if (!access) {
      return NextResponse.json(
        { error: "Access denied — purchase required" },
        { status: 403 }
      )
    }
  }

  // Fetch user email
  const { data: userData } = await supabase.auth.admin.getUserById(auth.userId)
  const email = userData?.user?.email ?? ""

  const now = Math.floor(Date.now() / 1000)
  const expiresAt = now + TOKEN_TTL_SECONDS

  const privateKey = await getPrivateKey()

  const token = await new SignJWT({
    sub: auth.userId,
    email,
    agent_id: agent.id,
    agent_slug: agent.slug,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .setIssuer("web42")
    .sign(privateKey)

  return NextResponse.json({
    token,
    agentUrl: agent.a2a_url,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  })
}
