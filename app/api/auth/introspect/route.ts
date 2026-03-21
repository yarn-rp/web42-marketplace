// POST /api/auth/introspect
// Body: { token: string }
// Response: { active: true, sub: string, email: string } | { active: false }

import { authenticateRequest } from "@/lib/auth/cli-auth"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request): Promise<Response> {
  // 1. Extract token from body
  let token: string | undefined
  try {
    const body = await request.json() as { token?: string }
    token = body.token
  } catch {
    return Response.json({ active: false }, { status: 400 })
  }

  if (!token) return Response.json({ active: false })

  // 2. Validate against existing cli_tokens table via authenticateRequest
  const fakeRequest = new Request("http://localhost", {
    headers: { authorization: `Bearer ${token}` },
  })
  const result = await authenticateRequest(fakeRequest)

  if (!result) return Response.json({ active: false })

  // 3. Fetch email from Supabase
  const supabaseAdmin = getSupabaseAdmin()
  const { data: user } = await supabaseAdmin.auth.admin.getUserById(result.userId)

  return Response.json({
    active: true,
    sub: result.userId,
    email: user?.user?.email ?? "",
  })
}
