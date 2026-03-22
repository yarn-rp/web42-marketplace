import crypto from "crypto"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/db/supabase/server"

export function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface AuthResult {
  userId: string
  source: "cli" | "session"
}

/**
 * Authenticate a platform API request.
 *
 * Two distinct paths — not fallbacks:
 *   - Bearer token  → CLI token (SHA256 hash lookup in cli_tokens)
 *   - No Bearer     → Supabase session cookie (browser)
 *
 * Handshake JWTs (agent-scoped) are NOT validated here.
 * Agents validate those via the /api/auth/introspect endpoint.
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthResult | null> {
  const authHeader = request.headers.get("authorization")

  // CLI caller — Bearer token is a CLI token, validate via cli_tokens table
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)

    try {
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")
      const supabaseAdmin = getSupabaseAdmin()
      const { data: cliToken } = await supabaseAdmin
        .from("cli_tokens")
        .select("user_id, expires_at")
        .eq("token_hash", tokenHash)
        .single()

      if (!cliToken) return null

      if (
        cliToken.expires_at &&
        new Date(cliToken.expires_at) < new Date()
      ) {
        return null
      }

      return { userId: cliToken.user_id, source: "cli" }
    } catch {
      return null
    }
  }

  // Browser caller — Supabase session cookie
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (user) {
    return { userId: user.id, source: "session" }
  }

  return null
}
