"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Bot, Star } from "lucide-react"

import type { Agent } from "@/lib/types"
import { getCardName, getCardDescription, getMarketplaceExtension } from "@/lib/agent-card-utils"
import { AgentPriceBadge } from "@/components/agent-price-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const MAX_VISIBLE_TAGS = 3

export function AgentCard({
  agent,
  order,
  showPrice,
}: {
  agent: Agent
  order: number
  showPrice?: boolean
}) {
  const owner = agent.owner
  const username = owner?.username ?? "unknown"
  // Slug is @user~agent-name — extract just the agent part for the URL
  const agentSlugPart = agent.slug.includes("~")
    ? agent.slug.split("~").pop()!
    : agent.slug
  const href = `/${username}/${agentSlugPart}`
  const name = getCardName(agent.agent_card)
  const description = getCardDescription(agent.agent_card)
  const marketplace = getMarketplaceExtension(agent.agent_card)
  const sortedResources = [...(agent.resources ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const thumbnail = sortedResources[0]
  const tags = agent.tags ?? []
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS)
  const overflowCount = tags.length - MAX_VISIBLE_TAGS

  return (
    <motion.div
      key={`agent-card-${agent.id}-${order}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Link href={href} className="group block h-full">
        <Card className="h-full flex flex-col overflow-hidden transition-colors hover:bg-accent/50">
          {/* 1. Thumbnail -- always rendered for consistent height */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
            {thumbnail ? (
              thumbnail.type === "video" ? (
                <video
                  src={thumbnail.url}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <img
                  src={thumbnail.url}
                  alt={name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                {agent.profile_image_url ? (
                  <img
                    src={agent.profile_image_url}
                    alt={name}
                    className="size-16 rounded-xl object-cover opacity-60"
                  />
                ) : (
                  <Bot className="size-14 text-muted-foreground/40" />
                )}
              </div>
            )}
            {showPrice && (
              <div className="absolute right-3 top-3">
                <AgentPriceBadge
                  priceCents={marketplace?.price_cents ?? 0}
                  currency={marketplace?.currency ?? "usd"}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          {/* 2. Identity -- avatar + name + username */}
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              {agent.profile_image_url ? (
                <img
                  src={agent.profile_image_url}
                  alt={name}
                    className="size-9 shrink-0 rounded-md object-cover"
                />
              ) : (
                <Avatar className="size-9">
                  <AvatarImage src={owner?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-sm font-semibold leading-tight">
                  {name}
                </CardTitle>
                <span className="font-mono text-[11px] text-muted-foreground">
                  @{username}
                </span>
              </div>
            </div>
          </CardHeader>

          {/* 3. Description + tags -- flex-1 absorbs height variance */}
          <CardContent className="flex flex-1 flex-col gap-2 px-4 pb-2">
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>

            {/* 4. Tags */}
            {visibleTags.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1">
                {visibleTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    {tag.name}
                  </Badge>
                ))}
                {overflowCount > 0 && (
                  <Badge
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                  >
                    +{overflowCount}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>

          {/* 5. Footer -- pinned to bottom */}
          <CardFooter className="mt-auto flex items-center gap-3 px-4 pb-4 pt-2 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-3" />
              {agent.stars_count}
            </span>
            {marketplace?.license && (
              <Badge variant="outline" className="ml-auto font-mono text-[10px]">
                {marketplace.license}
              </Badge>
            )}
            {!marketplace?.license && (marketplace?.price_cents ?? 0) > 0 && (
              <div className="ml-auto">
                <AgentPriceBadge
                  priceCents={marketplace?.price_cents ?? 0}
                  currency={marketplace?.currency ?? "usd"}
                  className="text-[10px]"
                />
              </div>
            )}
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
