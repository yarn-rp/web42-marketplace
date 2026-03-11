import { notFound } from "next/navigation"

import { FadeIn } from "@/components/cult/fade-in"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { ProfileAgentGrid } from "@/components/profile-agent-grid"
import { ProfileHeader } from "@/components/profile-header"
import { ProfileReadmeEditor } from "@/components/profile-readme-editor"
import { getAgentsByUser } from "@/app/actions/agent"
import { getCurrentProfile, getProfile } from "@/app/actions/profile"

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ user: string }>
}) {
  const { user: username } = await params
  const profile = await getProfile(username)

  if (!profile) {
    notFound()
  }

  const [currentProfile, agents] = await Promise.all([
    getCurrentProfile(),
    getAgentsByUser(username),
  ])

  const isOwner = !!currentProfile && currentProfile.id === profile.id
  const totalStars = agents.reduce((sum, a) => sum + a.stars_count, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <FadeIn>
        <ProfileHeader
          profile={profile}
          totalStars={totalStars}
          agentCount={agents.length}
        />

        {isOwner ? (
          <section className="mb-8">
            <ProfileReadmeEditor
              initialContent={profile.profile_readme ?? ""}
            />
          </section>
        ) : (
          profile.profile_readme && (
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold">About</h2>
              <div className="rounded-lg border bg-muted/30 p-6">
                <MarkdownRenderer content={profile.profile_readme} />
              </div>
            </section>
          )
        )}

        <section>
          <h2 className="mb-4 text-lg font-semibold">
            {isOwner ? "Your Agents" : "Published Agents"}
          </h2>
          <ProfileAgentGrid
            agents={agents}
            isOwner={isOwner}
            profileUsername={profile.username ?? username}
          />
        </section>
      </FadeIn>
    </div>
  )
}
