import Link from "next/link"
import {
  CalendarIcon,
  Download,
  ExternalLink,
  GitFork,
  TagIcon,
  UserIcon,
} from "lucide-react"

import type { Agent } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { AgentPriceBadge } from "./agent-price-badge"
import { InstallSnippet } from "./install-snippet"
import { MarkdownRenderer } from "./markdown-renderer"
import { RemixButton } from "./remix-button"
import { StarButton } from "./star-button"

interface AgentShowcaseProps {
  agent: Agent
}

export function AgentShowcase({ agent }: AgentShowcaseProps) {
  const owner = agent.owner
  const username = owner?.username ?? "unknown"

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* Cover image hero */}
      {agent.cover_image_url && (
        <div className="relative mb-8 w-full overflow-hidden rounded-xl">
          <img
            src={agent.cover_image_url}
            alt={agent.name}
            className="aspect-[21/9] w-full object-cover"
          />
        </div>
      )}

      {agent.demo_video_url && !agent.cover_image_url && (
        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-xl">
          <iframe
            src={agent.demo_video_url}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">{agent.name}</h1>
          <p className="mb-4 text-base text-muted-foreground">
            {agent.description}
          </p>

          {/* Author */}
          <Link
            href={`/${username}`}
            className="mb-6 inline-flex items-center gap-2 hover:underline"
          >
            <Avatar className="size-7">
              <AvatarImage src={owner?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-mono text-sm font-medium">@{username}</span>
          </Link>

          {/* Remixed from banner */}
          {agent.remixed_from_id && agent.remixed_from && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
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

          {/* Action bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <StarButton
              agentId={agent.id}
              initialStarred={agent.has_starred ?? false}
              initialCount={agent.stars_count}
            />
            {!agent.remixed_from_id && (
              <RemixButton agentId={agent.id} agentName={agent.name} />
            )}
            <div className="flex items-center gap-4 font-mono text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Download className="size-4" />
                {agent.installs_count}
              </span>
              {!agent.remixed_from_id && (
                <span className="flex items-center gap-1">
                  <GitFork className="size-4" />
                  {agent.remixes_count}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <InstallSnippet username={username} agentSlug={agent.slug} />
          </div>

          <Separator className="mb-6" />

          {/* README */}
          {agent.readme && <MarkdownRenderer content={agent.readme} />}
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-4 md:w-72">
          {/* About card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <AgentPriceBadge
                  priceCents={agent.price_cents ?? 0}
                  currency={agent.currency}
                />
              </div>
              {agent.manifest?.version && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {agent.manifest.version}
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" />
                <Link href={`/${username}`} className="hover:underline">
                  {owner?.full_name ?? username}
                </Link>
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

              {agent.manifest?.modelPreferences?.primary && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <span>{agent.manifest.modelPreferences.primary}</span>
                </div>
              )}
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

          {/* Channels / Skills / Plugins */}
          {agent.manifest &&
            (agent.manifest.channels?.length ||
              agent.manifest.skills?.length ||
              agent.manifest.plugins?.length) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agent.manifest.channels &&
                    agent.manifest.channels.length > 0 && (
                      <div>
                        <CardDescription className="mb-2 text-xs uppercase tracking-wider">
                          Channels
                        </CardDescription>
                        <div className="flex flex-wrap gap-1.5">
                          {agent.manifest.channels.map((ch) => (
                            <Badge
                              key={ch}
                              variant="secondary"
                              className="text-xs"
                            >
                              {ch}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {agent.manifest.skills &&
                    agent.manifest.skills.length > 0 && (
                      <div>
                        <CardDescription className="mb-2 text-xs uppercase tracking-wider">
                          Skills
                        </CardDescription>
                        <div className="flex flex-wrap gap-1.5">
                          {agent.manifest.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {agent.manifest.plugins &&
                    agent.manifest.plugins.length > 0 && (
                      <div>
                        <CardDescription className="mb-2 text-xs uppercase tracking-wider">
                          Plugins
                        </CardDescription>
                        <div className="flex flex-wrap gap-1.5">
                          {agent.manifest.plugins.map((plugin) => (
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
