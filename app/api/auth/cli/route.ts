import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

export const dynamic = "force-dynamic"

interface RegisterRequest {
  action: "register"
  code: string
}

interface PollRequest {
  action: "poll"
  code: string
}

type RequestBody = RegisterRequest | PollRequest

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const body: RequestBody = await request.json()

  if (body.action === "register") {
    const { code } = body as RegisterRequest

    if (!code || typeof code !== "string" || code.length !== 32) {
      return NextResponse.json(
        { error: "Invalid code format (expected 32-char hex string)" },
        { status: 400 }
      )
    }

    const db = getSupabaseAdmin()

    // Store the pending auth code
    const { error } = await db.from("cli_auth_codes").insert({
      code,
      status: "pending",
    })

    if (error) {
      console.error("[api/auth/cli POST register] DB error:", error)
      return NextResponse.json(
        { error: "Failed to register code" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }

  if (body.action === "poll") {
    const { code } = body as PollRequest

    if (!code || typeof code !== "string" || code.length !== 32) {
      return NextResponse.json(
        { error: "Invalid code format" },
        { status: 400 }
      )
    }

    const db = getSupabaseAdmin()

    // Check if the code has been confirmed
    const { data, error } = await db
      .from("cli_auth_codes")
      .select("status, user_id, expires_at")
      .eq("code", code)
      .single()

    if (error) {
      console.error("[api/auth/cli POST poll] DB select error:", error)
      return NextResponse.json({ status: "pending" })
    }

    if (!data) {
      return NextResponse.json({ status: "pending" })
    }

    // Check if code has expired
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ status: "expired" })
    }

    // Not yet confirmed
    if (data.status !== "confirmed" || !data.user_id) {
      return NextResponse.json({ status: "pending" })
    }

    // Code confirmed! Generate a token and fetch user data
    const userId = data.user_id

    // Create a CLI token
    const tokenBytes = crypto.randomBytes(32)
    const token = tokenBytes.toString("hex")
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    const { error: tokenError } = await db.from("cli_tokens").insert({
      user_id: userId,
      token_hash: tokenHash,
      name: "CLI Login",
    })

    if (tokenError) {
      console.error("[api/auth/cli POST poll] Token creation error:", tokenError)
      return NextResponse.json(
        { error: "Failed to create token" },
        { status: 500 }
      )
    }

    // Fetch user details from public.users table
    const { data: profile, error: profileError } = await db
      .from("users")
      .select("username, full_name, avatar_url")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      console.error("[api/auth/cli POST poll] User fetch error:", profileError)
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      )
    }

    // Clean up the auth code
    await db.from("cli_auth_codes").delete().eq("code", code)

    return NextResponse.json({
      status: "authenticated",
      user_id: userId,
      token,
      username: profile.username || "",
      full_name: profile.full_name || "",
      avatar_url: profile.avatar_url || "",
    })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
