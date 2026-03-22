"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarIcon,
  ExternalLink,
  TagIcon,
  Users,
  Zap,
} from "lucide-react"

import type { PublishValidation } from "@/app/actions/agent"
import type { Agent, AgentResource, Order, Tag } from "@/lib/types"
import { getCardName, getCardDescription, getMarketplaceExtension, getCardVersion, getCardProvider } from "@/lib/agent-card-utils"
import { getPlatform } from "@/lib/platforms"
import { PlatformLogo } from "@/components/platform-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { AgentDetailTabs } from "./agent-detail-tabs"
import { AgentPriceBadge } from "./agent-price-badge"
import { CheckoutSuccess } from "./checkout-success"
import { Button } from "@/components/ui/button"
import { GetAgentButton } from "./get-agent-button"
import { RefundButton } from "./refund-button"
import { PublishDialog } from "./publish-dialog"
import { ResourceGallery } from "./resource-gallery"
import { StarButton } from "./star-button"

interface AgentShowcaseProps {
  agent: Agent
  resources?: AgentResource[]
  isOwner?: boolean
  hasAccess?: boolean
  isAuthenticated?: boolean
  validation?: PublishValidation | null
  allTags?: Tag[]
  selectedTagIds?: string[]
  profileUsername?: string
  order?: Order | null
  checkoutSuccess?: boolean
  currentUsername?: string
}

export function AgentShowcase({
  agent,
  resources = [],
  isOwner = false,
  hasAccess = false,
  isAuthenticated = false,
  validation = null,
  allTags = [],
  selectedTagIds = [],
  profileUsername = "",
  order = null,
  checkoutSuccess = false,
  currentUsername,
}: AgentShowcaseProps) {
  const router = useRouter()
  const owner = agent.owner
  const username = owner?.username ?? "unknown"
  const agentName = getCardName(agent.agent_card)
  const agentDescription = getCardDescription(agent.agent_card)
  const mktExt = getMarketplaceExtension(agent.agent_card)
  const platformInfo = getPlatform(getCardProvider(agent.agent_card) ?? undefined)

  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [freeAcquireSuccess, setFreeAcquireSuccess] = useState(false)

  const openGallery = (index: number) => {
    setGalleryIndex(index)
    setGalleryOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      {(checkoutSuccess || freeAcquireSuccess) && (
        <CheckoutSuccess
          agentName={agentName}
          agentSlug={agent.slug}
          username={username}
          platform={getCardProvider(agent.agent_card) ?? undefined}
          currentUsername={currentUsername}
          isFree={freeAcquireSuccess}
          onClose={
            freeAcquireSuccess
              ? () => {
                  setFreeAcquireSuccess(false)
                  router.refresh()
                }
              : undefined
          }
        />
      )}

      {/* Name and description at top */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          {agent.profile_image_url && (
            <img
              src={agent.profile_image_url}
              alt={agentName}
              className="size-16 shrink-0 rounded-xl object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{agentName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {platformInfo && (
                <a
                  href={platformInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium transition-colors hover:bg-accent"
                >
                  <PlatformLogo platform={platformInfo} size={16} className="rounded-sm" />
                  {platformInfo.name}
                </a>
              )}
              {agent.gateway_status === "live" && (
                <Badge variant="default" className="gap-1">
                  <Zap className="size-3.5" />
                  Live
                </Badge>
              )}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {isOwner && validation && (
              <PublishDialog
                agent={agent}
                validation={validation}
                profileUsername={profileUsername}
                variant="secondary"
              />
            )}
            {isOwner || hasAccess ? (
              <>
                {agent.a2a_url && (
                  <Button asChild size="sm">
                    <a href={agent.a2a_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 size-3.5" />
                      Use Agent
                    </a>
                  </Button>
                )}
                {!isOwner && order && (
                  <RefundButton
                    orderId={order.id}
                    orderCreatedAt={order.created_at}
                    amountCents={order.amount_cents}
                  />
                )}
              </>
            ) : (
              <GetAgentButton
                agentId={agent.id}
                priceCents={mktExt?.price_cents ?? 0}
                isAuthenticated={isAuthenticated}
                onSuccess={
                  (mktExt?.price_cents ?? 0) === 0
                    ? () => setFreeAcquireSuccess(true)
                    : undefined
                }
              />
            )}
          </div>
        </div>
        <p className="text-base text-muted-foreground">{agentDescription}</p>
      </div>

      {/* Resources gallery -- full width, max 4 visible */}
      {resources.length > 0 && (
        <div className="mb-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {resources.slice(0, 4).map((resource, index) => {
              const isLast = index === 3
              const remaining = resources.length - 4

              return (
                <button
                  key={resource.id}
                  type="button"
                  className="group/res relative overflow-hidden rounded-lg border bg-muted/30 text-left transition hover:border-primary/40"
                  onClick={() => openGallery(index)}
                >
                  {resource.type === "video" ? (
                    <video
                      src={resource.url}
                      muted
                      preload="metadata"
                      className="aspect-video w-full bg-black object-cover"
                    />
                  ) : (
                    <img
                      src={resource.url}
                      alt={resource.title}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover/res:bg-black/20" />
                  {isLast && remaining > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-lg font-semibold text-white">
                        +{remaining} more
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <ResourceGallery
        resources={resources}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        initialIndex={galleryIndex}
      />

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <Separator className="mb-6" />

          {/* Tabbed content view */}
          <AgentDetailTabs
            agent={agent}
            files={[]}
            isOwner={isOwner}
            hasAccess={hasAccess}
            resources={resources}
            allTags={allTags}
            selectedTagIds={selectedTagIds}
            profileUsername={profileUsername}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-4 md:w-72">
          {/* Platform card */}
          {platformInfo && (
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <PlatformLogo platform={platformInfo} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Built for {platformInfo.name}</p>
                  <a
                    href={platformInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {platformInfo.url.replace("https://", "")}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* About card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Link
                href={`/${username}`}
                className="flex items-center gap-2 hover:underline"
              >
                <Avatar className="size-8">
                  <AvatarImage src={owner?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-mono font-medium">@{username}</span>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <StarButton
                  agentId={agent.id}
                  initialStarred={agent.has_starred ?? false}
                  initialCount={agent.stars_count}
                />
                <span className="flex items-center gap-1 font-mono text-muted-foreground">
                  <Users className="size-4" />
                  {agent.interactions_count}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <AgentPriceBadge
                  priceCents={mktExt?.price_cents ?? 0}
                  currency={mktExt?.currency ?? "usd"}
                />
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="size-4" />
                <span>
                  {new Date(agent.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {agent.published_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="size-4" />
                  <span>
                    Published{" "}
                    {new Date(agent.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {getCardVersion(agent.agent_card)}
                </Badge>
              </div>
              {getCardProvider(agent.agent_card) && !platformInfo && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <Badge variant="secondary" className="text-xs">
                    {getCardProvider(agent.agent_card)}
                  </Badge>
                </div>
              )}
              {mktExt?.license && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">License</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {mktExt.license}
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Visibility</span>
                <Badge
                  variant={
                    (mktExt?.visibility ?? "public") === "public" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {mktExt?.visibility ?? "public"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          {agent.categories && agent.categories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {agent.categories.map((cat) => (
                    <Link key={cat.id} href={`/explore?category=${cat.name}`}>
                      <Badge variant="outline" className="text-xs">
                        {cat.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {agent.tags && agent.tags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TagIcon className="size-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {agent.tags.map((tag) => (
                    <Link key={tag.id} href={`/explore?tag=${tag.name}`}>
                      <Badge variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </aside>
      </div>
    </div>
  )
}
