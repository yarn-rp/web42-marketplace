import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { importSPKI, jwtVerify } from "jose"
import { createClient } from "@/db/supabase/server"

export function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface AuthResult {
  userId: string
  source: "jwt" | "session"
}

/**
 * Authenticate a request from either a Web42 JWT Bearer token or a browser session cookie.
 * Returns the user ID and auth source, or null if unauthenticated.
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthResult | null> {
  const authHeader = request.headers.get("authorization")

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)

    // Try to verify as a Web42-issued JWT
    const publicKeyPem = process.env.JWT_PUBLIC_KEY
    if (publicKeyPem) {
      try {
        const publicKey = await importSPKI(publicKeyPem, "RS256")
        const { payload } = await jwtVerify(token, publicKey, {
          issuer: "web42",
        })
        if (payload.sub) {
          return { userId: payload.sub, source: "jwt" }
        }
      } catch {
        // JWT verification failed — token is not a valid Web42 JWT
      }
    }

    // Fallback: try Supabase session token
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      return { userId: user.id, source: "session" }
    }

    return null
  }

  // No Bearer token — try browser session cookie
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (user) {
    return { userId: user.id, source: "session" }
  }

  return null
}
