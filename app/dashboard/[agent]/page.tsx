import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/app/actions/profile"

export default async function DashboardAgentPage({
  params,
}: {
  params: Promise<{ agent: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const { agent: agentSlug } = await params
  redirect(`/${profile.username}/${agentSlug}`)
}
