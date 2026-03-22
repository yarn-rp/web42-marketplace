import { importSPKI, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const ALG = "RS256"

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getPublicKey() {
  const pem = process.env.JWT_PUBLIC_KEY
  if (!pem) throw new Error("JWT_PUBLIC_KEY env var is not set")
  return importSPKI(pem, ALG)
}

function parseBasicAuth(
  header: string | null
): { clientId: string; clientSecret: string } | null {
  if (!header?.startsWith("Basic ")) return null
  try {
    const decoded = atob(header.slice(6))
    const colon = decoded.indexOf(":")
    if (colon < 0) return null
    return {
      clientId: decoded.slice(0, colon),
      clientSecret: decoded.slice(colon + 1),
    }
  } catch {
    return null
  }
}

// RFC 7662 — always returns 200 with { active: true|false }
export async function POST(request: Request): Promise<Response> {
  // 1. Parse Basic auth credentials (developer app)
  const creds = parseBasicAuth(request.headers.get("authorization"))
  if (!creds) {
    return Response.json({ active: false })
  }

  // 2. Look up developer app
  const supabase = getSupabaseAdmin()
  const { data: app } = await supabase
    .from("developer_apps")
    .select("id, client_secret_hash")
    .eq("client_id", creds.clientId)
    .is("revoked_at", null)
    .single()

  if (!app) {
    return Response.json({ active: false })
  }

  // 3. Verify client secret
  const secretValid = await bcrypt.compare(
    creds.clientSecret,
    app.client_secret_hash
  )
  if (!secretValid) {
    return Response.json({ active: false })
  }

  // 4. Parse token from form-urlencoded body (RFC 7662)
  let token: string | null = null
  try {
    const contentType = request.headers.get("content-type") ?? ""
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text()
      const params = new URLSearchParams(text)
      token = params.get("token")
    } else {
      const body = (await request.json()) as { token?: string }
      token = body.token ?? null
    }
  } catch {
    return Response.json({ active: false })
  }

  if (!token) {
    return Response.json({ active: false })
  }

  // 5. Verify JWT
  try {
    const publicKey = await getPublicKey()
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: "web42",
    })

    return Response.json({
      active: true,
      sub: payload.sub,
      email: payload.email,
      agent_id: payload.agent_id,
      exp: payload.exp,
      iat: payload.iat,
    })
  } catch {
    return Response.json({ active: false })
  }
}
