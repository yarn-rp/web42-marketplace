import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/app/actions/profile"

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  redirect(`/${profile.username}`)
}
