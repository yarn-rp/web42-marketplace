"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Download, GitFork, Star } from "lucide-react"

import type { Agent } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AgentPriceBadge } from "@/components/agent-price-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AgentCard({
  agent,
  order,
  trim,
  showPrice,
}: {
  agent: Agent
  order: number
  trim?: boolean
  showPrice?: boolean
}) {
  const owner = agent.owner
  const username = owner?.username ?? "unknown"
  const href = `/${username}/${agent.slug}`
  const primaryCategory = agent.categories?.[0]
  const sortedResources = [...(agent.resources ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const thumbnail = sortedResources[0]

  return (
    <motion.div
      key={`agent-card-${agent.id}-${order}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link href={href} className="group block">
        <Card className="overflow-hidden transition-colors hover:bg-accent/50">
          {thumbnail && (
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              {thumbnail.type === "video" ? (
                <video
                  src={thumbnail.url}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <img
                  src={thumbnail.url}
                  alt={agent.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute right-3 top-3 flex gap-1.5">
                {showPrice && (
                  <AgentPriceBadge
                    priceCents={agent.price_cents ?? 0}
                    currency={agent.currency}
                    className="text-xs backdrop-blur-sm"
                  />
                )}
                {primaryCategory && (
                  <Badge
                    variant="secondary"
                    className="text-xs backdrop-blur-sm"
                  >
                    {primaryCategory.name}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              {agent.profile_image_url ? (
                <img
                  src={agent.profile_image_url}
                  alt={agent.name}
                  className="size-5 shrink-0 rounded object-cover"
                />
              ) : (
                <Avatar className="size-5">
                  <AvatarImage src={owner?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="font-mono text-xs text-muted-foreground">
                @{username}
              </span>
            </div>
            <CardTitle className="text-base">{agent.name}</CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-2">
            {agent.remixed_from && (
              <div className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <GitFork className="size-3" />
                <span>
                  Remixed from{" "}
                  <span className="font-mono font-medium text-foreground">
                    @{agent.remixed_from.owner?.username}/{agent.remixed_from.slug}
                  </span>
                </span>
              </div>
            )}
            <CardDescription className={cn("text-xs leading-relaxed")}>
              {trim
                ? `${agent.description.slice(0, 100)}...`
                : agent.description}
            </CardDescription>
          </CardContent>

          <CardFooter className="flex items-center gap-3 px-4 pb-4 pt-2 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-3" />
              {agent.stars_count}
            </span>
            <span className="flex items-center gap-1">
              <Download className="size-3" />
              {agent.installs_count}
            </span>
            {agent.license && (
              <Badge variant="outline" className="ml-auto font-mono text-[10px]">
                {agent.license}
              </Badge>
            )}
            {!agent.license && (agent.price_cents ?? 0) > 0 && (
              <div className="ml-auto">
                <AgentPriceBadge
                  priceCents={agent.price_cents ?? 0}
                  currency={agent.currency}
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
