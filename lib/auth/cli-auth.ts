import { createHash } from "crypto"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/db/supabase/server"

function getSupabaseAdmin() {
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
 * Authenticate a request from either a CLI Bearer token or a browser session cookie.
 * Returns the user ID and auth source, or null if unauthenticated.
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthResult | null> {
  const authHeader = request.headers.get("authorization")

  if (authHeader?.startsWith("Bearer ")) {
    const rawToken = authHeader.slice(7)
    const tokenHash = createHash("sha256").update(rawToken).digest("hex")

    const supabaseAdmin = getSupabaseAdmin()
    const { data: tokenRow } = await supabaseAdmin
      .from("cli_tokens")
      .select("id, user_id, expires_at")
      .eq("token_hash", tokenHash)
      .single()

    if (!tokenRow) return null

    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      await supabaseAdmin.from("cli_tokens").delete().eq("id", tokenRow.id)
      return null
    }

    await supabaseAdmin
      .from("cli_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", tokenRow.id)

    return { userId: tokenRow.user_id, source: "cli" }
  }

  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (user) {
    return { userId: user.id, source: "session" }
  }

  return null
}
