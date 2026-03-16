import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { createClient as createServerClient } from "@/db/supabase/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.json()
  const { code } = body

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from("cli_auth_codes")
    .update({ user_id: user.id, status: "confirmed" })
    .eq("code", code)
    .eq("status", "pending")

  if (error) {
    return NextResponse.json(
      { error: "Code not found or expired" },
      { status: 404 }
    )
  }

  return NextResponse.json({ status: "confirmed" })
}
