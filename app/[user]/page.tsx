import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { FadeIn } from "@/components/cult/fade-in"
import { ProfileHeader } from "@/components/profile-header"
import { ProfileTabs } from "@/components/profile-tabs"
import { getAgentsByUser, getPurchasedAgents } from "@/app/actions/agent"
import { getCurrentProfile, getProfile } from "@/app/actions/profile"
import { getSellerOrders } from "@/app/actions/stripe"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ user: string }>
}): Promise<Metadata> {
  const { user: username } = await params
  const profile = await getProfile(username)

  if (!profile) {
    return { title: "User Not Found" }
  }

  const displayName = profile.full_name ?? username
  const title = `${displayName} (@${username})`
  const description =
    profile.bio || `${displayName}'s profile on Web42 — The AI Agent Marketplace.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(profile.avatar_url && {
        images: [{ url: profile.avatar_url, alt: displayName }],
      }),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(profile.avatar_url && {
        images: [profile.avatar_url],
      }),
    },
  }
}

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

  const [sellerOrders, purchasedAgents] = await Promise.all([
    isOwner && profile.stripe_payouts_enabled ? getSellerOrders() : [],
    isOwner ? getPurchasedAgents() : [],
  ])

  const totalStars = agents.reduce((sum, a) => sum + a.stars_count, 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <FadeIn>
        <ProfileHeader
          profile={profile}
          totalStars={totalStars}
          agentCount={agents.length}
          isOwner={isOwner}
        />

        <Suspense>
          <ProfileTabs
            profile={profile}
            agents={agents}
            purchasedAgents={purchasedAgents}
            sellerOrders={sellerOrders}
            isOwner={isOwner}
            profileUsername={profile.username ?? username}
          />
        </Suspense>
      </FadeIn>
    </div>
  )
}
