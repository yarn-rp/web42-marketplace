import { randomBytes, createHash } from "crypto"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const body = await request.json()
  const { action, code } = body

  if (action === "register") {
    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 })
    }

    await supabaseAdmin.from("cli_auth_codes").delete().lt("expires_at", new Date().toISOString())

    const { error } = await supabaseAdmin.from("cli_auth_codes").insert({
      code,
      status: "pending",
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    if (error) {
      return NextResponse.json({ error: "Failed to register code" }, { status: 500 })
    }

    return NextResponse.json({ status: "pending" })
  }

  if (action === "poll") {
    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 })
    }

    const { data: entry } = await supabaseAdmin
      .from("cli_auth_codes")
      .select("*")
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (!entry) {
      return NextResponse.json({ error: "Code not found or expired" }, { status: 404 })
    }

    if (entry.status === "pending") {
      return NextResponse.json({ status: "pending" })
    }

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("username, full_name, avatar_url")
      .eq("id", entry.user_id)
      .single()

    const rawToken = randomBytes(32).toString("hex")
    const tokenHash = createHash("sha256").update(rawToken).digest("hex")

    await supabaseAdmin.from("cli_tokens").insert({
      user_id: entry.user_id,
      token_hash: tokenHash,
      name: `CLI login on ${new Date().toISOString().split("T")[0]}`,
    })

    await supabaseAdmin.from("cli_auth_codes").delete().eq("code", code)

    return NextResponse.json({
      status: "authenticated",
      token: rawToken,
      user_id: entry.user_id,
      username: profile?.username,
      full_name: profile?.full_name,
      avatar_url: profile?.avatar_url,
    })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
