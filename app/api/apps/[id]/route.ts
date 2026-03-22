import { NextResponse } from "next/server"
import { authenticateRequest, getSupabaseAdmin } from "@/lib/auth/cli-auth"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const supabase = getSupabaseAdmin()

  // Verify ownership
  const { data: app } = await supabase
    .from("developer_apps")
    .select("id, owner_id")
    .eq("id", id)
    .single()

  if (!app || app.owner_id !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { error } = await supabase
    .from("developer_apps")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
