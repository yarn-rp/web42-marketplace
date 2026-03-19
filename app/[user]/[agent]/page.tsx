import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { AgentShowcase } from "@/components/agent-showcase"
import { FadeIn } from "@/components/cult/fade-in"
import {
  getAgentBySlug,
  getAgentFiles,
  getAgentResources,
  getPublishValidation,
} from "@/app/actions/agent"
import { getOrderForAgent, verifyAndFulfillCheckout } from "@/app/actions/stripe"
import { getCachedTags } from "@/app/actions/filters"
import { getCurrentProfile } from "@/app/actions/profile"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ user: string; agent: string }>
}): Promise<Metadata> {
  const { user: username, agent: agentSlug } = await params
  const agent = await getAgentBySlug(username, agentSlug)

  if (!agent) {
    return { title: "Agent Not Found" }
  }

  const title = `${agent.name} by ${agent.owner?.full_name ?? username}`
  const description =
    agent.description ||
    `${agent.name} — an AI agent on the Web42 marketplace.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(agent.profile_image_url && {
        images: [{ url: agent.profile_image_url, alt: agent.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(agent.profile_image_url && {
        images: [agent.profile_image_url],
      }),
    },
  }
}

export default async function AgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ user: string; agent: string }>
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}) {
  const { user: username, agent: agentSlug } = await params
  const { checkout, session_id } = await searchParams

  const checkoutSuccess = checkout === "success"

  if (checkoutSuccess && session_id) {
    await verifyAndFulfillCheckout(session_id)
  }

  const agent = await getAgentBySlug(username, agentSlug)
  if (!agent) {
    notFound()
  }

  const currentProfile = await getCurrentProfile()
  const isOwner = !!currentProfile && currentProfile.id === agent.owner_id
  const isAuthenticated = !!currentProfile
  const hasAccess = agent.has_access ?? isOwner
  const profileUsername = agent.owner?.username ?? username

  const [agentFiles, resources, validation, allTags, order] = await Promise.all([
    getAgentFiles(agent.id),
    getAgentResources(agent.id),
    isOwner ? getPublishValidation(agent.id) : null,
    isOwner ? getCachedTags() : [],
    hasAccess && !isOwner ? getOrderForAgent(agent.id) : null,
  ])

  const selectedTagIds = (agent.tags ?? []).map((t) => t.id)

  return (
    <div className="z-10">
      <div className="relative mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
        <FadeIn>
          <AgentShowcase
            agent={agent}
            files={agentFiles}
            resources={resources}
            isOwner={isOwner}
            hasAccess={hasAccess}
            isAuthenticated={isAuthenticated}
            validation={validation}
            allTags={allTags}
            selectedTagIds={selectedTagIds}
            profileUsername={profileUsername}
            order={order}
            checkoutSuccess={checkoutSuccess && hasAccess}
            currentUsername={currentProfile?.username ?? undefined}
          />
        </FadeIn>
      </div>
    </div>
  )
}
