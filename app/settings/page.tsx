import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/app/actions/profile"

export default async function SettingsPage() {
  const profile = await getCurrentProfile()

  if (!profile?.username) {
    redirect("/login")
  }

  redirect(`/${profile.username}`)
}
