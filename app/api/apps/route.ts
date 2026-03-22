import { NextResponse } from "next/server"
import { randomBytes, randomUUID } from "crypto"
import bcrypt from "bcrypt"
import { authenticateRequest, getSupabaseAdmin } from "@/lib/auth/cli-auth"

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data: apps, error } = await supabase
    .from("developer_apps")
    .select("id, name, client_id, secret_prefix, created_at, revoked_at")
    .eq("owner_id", auth.userId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ apps })
}

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let name: string
  try {
    const body = (await request.json()) as { name?: string }
    name = body.name?.trim() ?? ""
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    )
  }

  const clientId = randomUUID()
  const clientSecret = randomBytes(32).toString("hex")
  const secretPrefix = clientSecret.slice(0, 8)
  const clientSecretHash = await bcrypt.hash(clientSecret, 10)

  const supabase = getSupabaseAdmin()
  const { data: app, error } = await supabase
    .from("developer_apps")
    .insert({
      owner_id: auth.userId,
      name,
      client_id: clientId,
      client_secret_hash: clientSecretHash,
      secret_prefix: secretPrefix,
    })
    .select("id, name, client_id, secret_prefix, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ...app,
    client_secret: clientSecret,
  })
}
