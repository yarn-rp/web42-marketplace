"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CalendarIcon,
  Download,
  GitFork,
  TagIcon,
} from "lucide-react"

import type { PublishValidation } from "@/app/actions/agent"
import type { Agent, AgentFile, AgentResource, Order, Tag } from "@/lib/types"
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
import { GetAgentButton } from "./get-agent-button"
import { InstallButton } from "./install-button"
import { RefundButton } from "./refund-button"
import { PublishDialog } from "./publish-dialog"
import { RemixButton } from "./remix-button"
import { ResourceGallery } from "./resource-gallery"
import { StarButton } from "./star-button"

interface AgentShowcaseProps {
  agent: Agent
  files?: AgentFile[]
  resources?: AgentResource[]
  isOwner?: boolean
  hasAccess?: boolean
  isAuthenticated?: boolean
  validation?: PublishValidation | null
  allTags?: Tag[]
  selectedTagIds?: string[]
  profileUsername?: string
  order?: Order | null
}

export function AgentShowcase({
  agent,
  files = [],
  resources = [],
  isOwner = false,
  hasAccess = false,
  isAuthenticated = false,
  validation = null,
  allTags = [],
  selectedTagIds = [],
  profileUsername = "",
  order = null,
}: AgentShowcaseProps) {
  const owner = agent.owner
  const username = owner?.username ?? "unknown"
  const platformInfo = getPlatform(agent.manifest?.platform)

  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const openGallery = (index: number) => {
    setGalleryIndex(index)
    setGalleryOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      {/* Name and description at top */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          {agent.profile_image_url && (
            <img
              src={agent.profile_image_url}
              alt={agent.name}
              className="size-16 shrink-0 rounded-xl object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{agent.name}</h1>
            {platformInfo && (
              <a
                href={platformInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium transition-colors hover:bg-accent"
              >
                <PlatformLogo platform={platformInfo} size={16} className="rounded-sm" />
                {platformInfo.name}
              </a>
            )}
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
                {!isOwner && !agent.remixed_from_id && (
                  <RemixButton
                    agentId={agent.id}
                    agentName={agent.name}
                    variant="outline"
                  />
                )}
                <InstallButton username={username} agentSlug={agent.slug} platform={agent.manifest?.platform} />
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
                priceCents={agent.price_cents ?? 0}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>
        </div>
        <p className="text-base text-muted-foreground">{agent.description}</p>
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
          {/* Remixed from banner */}
          {agent.remixed_from_id && agent.remixed_from && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
              <GitFork className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Remixed from{" "}
                <Link
                  href={`/${agent.remixed_from.owner?.username}/${agent.remixed_from.slug}`}
                  className="font-mono font-medium text-primary hover:underline"
                >
                  @{agent.remixed_from.owner?.username}/{agent.remixed_from.slug}
                </Link>
              </span>
            </div>
          )}

          <Separator className="mb-6" />

          {/* Tabbed content view */}
          <AgentDetailTabs
            agent={agent}
            files={files}
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
                  <Download className="size-4" />
                  {agent.installs_count}
                </span>
                {!agent.remixed_from_id && (
                  <span className="flex items-center gap-1 font-mono text-muted-foreground">
                    <GitFork className="size-4" />
                    {agent.remixes_count}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <AgentPriceBadge
                  priceCents={agent.price_cents ?? 0}
                  currency={agent.currency}
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
          {agent.manifest && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {agent.manifest.version && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Version</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {agent.manifest.version}
                    </Badge>
                  </div>
                )}
                {agent.manifest.format && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Format</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {agent.manifest.format}
                    </Badge>
                  </div>
                )}
                {agent.manifest.platform && !platformInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Platform</span>
                    <Badge variant="secondary" className="text-xs">
                      {agent.manifest.platform}
                    </Badge>
                  </div>
                )}
                {agent.manifest.author && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Author</span>
                    <span className="font-mono text-xs">
                      @{agent.manifest.author}
                    </span>
                  </div>
                )}
                {agent.manifest.modelPreferences?.primary && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="max-w-[180px] truncate text-xs">
                      {agent.manifest.modelPreferences.primary}
                    </span>
                  </div>
                )}
                {agent.license && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">License</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {agent.license}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Visibility</span>
                  <Badge
                    variant={
                      agent.visibility === "public" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {agent.visibility ?? "public"}
                  </Badge>
                </div>
                {agent.manifest.plugins &&
                  agent.manifest.plugins.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-muted-foreground">Plugins</span>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.manifest.plugins.map((plugin: string) => (
                          <Badge
                            key={plugin}
                            variant="secondary"
                            className="text-xs"
                          >
                            {plugin}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {isOwner &&
                  agent.manifest.configVariables &&
                  agent.manifest.configVariables.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Config variables
                      </span>
                      <span className="font-mono text-xs">
                        {agent.manifest.configVariables.length}
                      </span>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

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

          {/* Remixed from */}
          {agent.remixed_from_id && agent.remixed_from && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <GitFork className="size-4" />
                  Remixed from
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/${agent.remixed_from.owner?.username}/${agent.remixed_from.slug}`}
                  className="group flex items-center gap-2 text-sm hover:underline"
                >
                  <span className="font-mono font-medium text-primary">
                    @{agent.remixed_from.owner?.username}/{agent.remixed_from.slug}
                  </span>
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {agent.remixed_from.name}
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
