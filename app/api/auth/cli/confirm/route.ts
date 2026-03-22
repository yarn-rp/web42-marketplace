// app/api/auth/cli/confirm/route.ts
import { redirect } from "next/navigation"
import { createClient } from "@/db/supabase/server"
import { getSupabaseAdmin } from "@/lib/auth/cli-auth"

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (!code) {
    return new Response("Missing code parameter", { status: 400 })
  }

  // Require authenticated session
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) {
    // Redirect to login with code so they can auth first
    redirect(`/login?cli_code=${encodeURIComponent(code)}`)
  }

  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from("cli_auth_codes")
    .update({ user_id: user.id, status: "confirmed" })
    .eq("code", code)
    .eq("status", "pending")

  if (error) {
    console.error("[api/auth/cli/confirm] DB error:", error)
    return new Response("Failed to confirm code", { status: 500 })
  }

  redirect("/login/cli-success")
}
