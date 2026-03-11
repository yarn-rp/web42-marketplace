import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { AgentShowcase } from "@/components/agent-showcase"
import { AgentVisibilityToggle } from "@/components/agent-visibility-toggle"
import { AgentPriceBadge } from "@/components/agent-price-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FadeIn } from "@/components/cult/fade-in"
import { FileBrowser } from "@/components/file-browser"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getAgentBySlug,
  getAgentFiles,
} from "@/app/actions/agent"
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

  const agentFiles = isOwner ? await getAgentFiles(agent.id) : []

  return (
    <div className="z-10">
      <div className="relative mx-auto w-full max-w-6xl py-4">
        <FadeIn>
          {isOwner && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${profileUsername}`}>
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Profile
                </Link>
              </Button>
              <AgentVisibilityToggle
                agentId={agent.id}
                currentVisibility={agent.visibility ?? "public"}
                profileUsername={profileUsername}
              />
              <AgentPriceBadge
                priceCents={agent.price_cents ?? 0}
                currency={agent.currency}
              />
            </div>
          )}

          <AgentShowcase agent={agent} />

          {isOwner && (
            <Tabs defaultValue="files" className="mt-8">
              <TabsList>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="readme">README</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="mt-6">
                {agentFiles.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="mb-2 text-sm text-muted-foreground">
                        No files uploaded yet.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Use{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5">
                          web42 push
                        </code>{" "}
                        to upload your agent files.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <FileBrowser files={agentFiles} />
                )}
              </TabsContent>

              <TabsContent value="readme" className="mt-6">
                {agent.readme ? (
                  <Card>
                    <CardContent className="p-6">
                      <MarkdownRenderer content={agent.readme} />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                      No README content available.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Agent Details</CardTitle>
                    <CardDescription>
                      Manifest and configuration for this agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {agent.manifest?.author && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Author</span>
                        <span>{agent.manifest.author}</span>
                      </div>
                    )}
                    {agent.manifest?.version && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-mono">{agent.manifest.version}</span>
                      </div>
                    )}
                    {agent.manifest?.modelPreferences?.primary && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model</span>
                        <span>{agent.manifest.modelPreferences.primary}</span>
                      </div>
                    )}
                    {agent.manifest?.channels &&
                      agent.manifest.channels.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Channels</span>
                          <div className="flex flex-wrap gap-1">
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
                    {agent.manifest?.skills &&
                      agent.manifest.skills.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {agent.manifest.skills.map((s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="text-xs"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {agent.manifest?.plugins &&
                      agent.manifest.plugins.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plugins</span>
                          <div className="flex flex-wrap gap-1">
                            {agent.manifest.plugins.map((p) => (
                              <Badge
                                key={p}
                                variant="secondary"
                                className="text-xs"
                              >
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </FadeIn>
      </div>
    </div>
  )
}
