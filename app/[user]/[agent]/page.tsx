import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { AgentDeleteButton } from "@/components/agent-delete-button"
import { AgentLicenseSelect } from "@/components/agent-license-select"
import { AgentPriceEditor } from "@/components/agent-price-editor"
import { AgentProfileImage } from "@/components/agent-profile-image"
import { AgentResourceUpload } from "@/components/agent-resource-upload"
import { AgentShowcase } from "@/components/agent-showcase"
import { AgentTagManager } from "@/components/agent-tag-manager"
import { PublishChecklist } from "@/components/publish-checklist"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/cult/fade-in"
import {
  getAgentBySlug,
  getAgentFiles,
  getAgentResources,
  getPublishValidation,
} from "@/app/actions/agent"
import { getCachedTags } from "@/app/actions/filters"
import { getCurrentProfile } from "@/app/actions/profile"

export default async function AgentPage({
  params,
}: {
  params: Promise<{ user: string; agent: string }>
}) {
  const { user: username, agent: agentSlug } = await params

  const agent = await getAgentBySlug(username, agentSlug)
  if (!agent) {
    notFound()
  }

  const currentProfile = await getCurrentProfile()
  const isOwner = !!currentProfile && currentProfile.id === agent.owner_id
  const profileUsername = agent.owner?.username ?? username

  const [agentFiles, resources, validation, allTags] = await Promise.all([
    getAgentFiles(agent.id),
    getAgentResources(agent.id),
    isOwner ? getPublishValidation(agent.id) : null,
    isOwner ? getCachedTags() : [],
  ])

  const selectedTagIds = (agent.tags ?? []).map((t) => t.id)

  return (
    <div className="z-10">
      <div className="relative mx-auto w-full max-w-6xl py-4">
        <FadeIn>
          {isOwner && (
            <div className="mb-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${profileUsername}`}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Profile
                  </Link>
                </Button>
                <div className="ml-auto">
                  <AgentDeleteButton
                    agentId={agent.id}
                    agentName={agent.name}
                    profileUsername={profileUsername}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {validation && (
                  <PublishChecklist
                    agent={agent}
                    validation={validation}
                    profileUsername={profileUsername}
                  />
                )}
                <AgentProfileImage
                  agentId={agent.id}
                  currentImageUrl={agent.profile_image_url}
                  profileUsername={profileUsername}
                />
                <AgentLicenseSelect
                  agentId={agent.id}
                  currentLicense={agent.license}
                  profileUsername={profileUsername}
                />
                <AgentPriceEditor
                  agentId={agent.id}
                  currentPriceCents={agent.price_cents ?? 0}
                  currency={agent.currency ?? "usd"}
                  profileUsername={profileUsername}
                />
                <AgentTagManager
                  agentId={agent.id}
                  allTags={allTags}
                  selectedTagIds={selectedTagIds}
                  profileUsername={profileUsername}
                />
                <AgentResourceUpload
                  agentId={agent.id}
                  resources={resources}
                  profileUsername={profileUsername}
                />
              </div>
            </div>
          )}

          <AgentShowcase
            agent={agent}
            files={agentFiles}
            resources={resources}
            isOwner={isOwner}
          />
        </FadeIn>
      </div>
    </div>
  )
}
