"use client"

import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CalendarIcon,
  FileIcon,
  FolderIcon,
  FolderOpen,
  Loader2,
  Pencil,
  Settings2,
  ShoppingBag,
  Wrench,
  X,
} from "lucide-react"
import { toast } from "sonner"

import type { Agent, AgentFile, AgentResource, Tag } from "@/lib/types"
import type { PublishValidation } from "@/app/actions/agent"
import { updateAgentReadme } from "@/app/actions/agent"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { AgentDeleteButton } from "./agent-delete-button"
import { AgentLicenseSelect } from "./agent-license-select"
import { AgentPriceEditor } from "./agent-price-editor"
import { AgentProfileImage } from "./agent-profile-image"
import { AgentResourceUpload } from "./agent-resource-upload"
import { AgentTagManager } from "./agent-tag-manager"
import { MarkdownRenderer } from "./markdown-renderer"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface AgentDetailTabsProps {
  agent: Agent
  files: AgentFile[]
  isOwner: boolean
  resources?: AgentResource[]
  allTags?: Tag[]
  selectedTagIds?: string[]
  profileUsername?: string
}

interface TreeEntry {
  name: string
  path: string
  isDirectory: boolean
  file?: AgentFile
}

function buildTree(files: AgentFile[], currentDir: string): TreeEntry[] {
  const prefix = currentDir ? currentDir + "/" : ""
  const entries = new Map<string, TreeEntry>()

  for (const file of files) {
    if (!file.path.startsWith(prefix) && currentDir) continue
    if (file.path === currentDir) continue

    const remaining = currentDir ? file.path.slice(prefix.length) : file.path
    const slashIdx = remaining.indexOf("/")

    if (slashIdx === -1) {
      entries.set(remaining, {
        name: remaining,
        path: file.path,
        isDirectory: false,
        file,
      })
    } else {
      const dirName = remaining.slice(0, slashIdx)
      if (!entries.has(dirName)) {
        entries.set(dirName, {
          name: dirName,
          path: prefix + dirName,
          isDirectory: true,
        })
      }
    }
  }

  return Array.from(entries.values()).sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.name.localeCompare(b.name)
  })
}

function isMarkdownFile(path: string): boolean {
  return /\.(md|mdx|markdown)$/i.test(path)
}

function ReadmeTab({
  readme,
  files,
  isOwner,
  agentId,
  profileUsername,
}: {
  readme?: string | null
  files: AgentFile[]
  isOwner: boolean
  agentId: string
  profileUsername: string
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const readmeContent =
    readme ||
    files.find((f) => /^readme\.md$/i.test(f.path))?.content

  const [draft, setDraft] = useState(readmeContent ?? "")

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateAgentReadme(agentId, draft, profileUsername)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("README updated")
        setIsEditing(false)
        router.refresh()
      }
    })
  }

  const handleCancel = () => {
    setDraft(readmeContent ?? "")
    setIsEditing(false)
  }

  if (!readmeContent && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <BookOpen className="mb-3 size-10 opacity-40" />
        <p className="text-sm">No README available for this agent.</p>
      </div>
    )
  }

  if (!readmeContent && isOwner && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <BookOpen className="mb-1 size-10 opacity-40" />
        <p className="text-sm">No README yet.</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="mr-2 size-3.5" />
          Write README
        </Button>
      </div>
    )
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 px-4 py-3">
          <BookOpen className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Edit README.md</CardTitle>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="mr-1 size-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Save
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div data-color-mode="dark">
            <MDEditor
              value={draft}
              onChange={(val) => setDraft(val ?? "")}
              height={500}
              preview="live"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 py-3">
        <BookOpen className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">README.md</CardTitle>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setDraft(readmeContent ?? "")
              setIsEditing(true)
            }}
          >
            <Pencil className="mr-1 size-3.5" />
            Edit
          </Button>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="p-6">
        <MarkdownRenderer content={readmeContent!} />
      </CardContent>
    </Card>
  )
}

function ContentTab({ files }: { files: AgentFile[] }) {
  const [currentDir, setCurrentDir] = useState("")
  const [selectedFile, setSelectedFile] = useState<AgentFile | null>(null)

  const entries = buildTree(files, currentDir)
  const breadcrumbs = currentDir ? currentDir.split("/") : []

  const handleNavigate = (entry: TreeEntry) => {
    if (entry.isDirectory) {
      setCurrentDir(entry.path)
      setSelectedFile(null)
    } else if (entry.file) {
      setSelectedFile(entry.file)
    }
  }

  const handleBreadcrumb = (index: number) => {
    if (index < 0) {
      setCurrentDir("")
    } else {
      setCurrentDir(breadcrumbs.slice(0, index + 1).join("/"))
    }
    setSelectedFile(null)
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FolderOpen className="mb-3 size-10 opacity-40" />
        <p className="text-sm">No files published yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={() => handleBreadcrumb(-1)}
          className={cn(
            "rounded px-1.5 py-0.5 transition-colors hover:bg-accent",
            !currentDir
              ? "font-medium text-foreground"
              : "text-muted-foreground"
          )}
        >
          root
        </button>
        {breadcrumbs.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            <button
              onClick={() => handleBreadcrumb(i)}
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors hover:bg-accent",
                i === breadcrumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* File table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableBody>
            {currentDir && (
              <TableRow
                className="cursor-pointer"
                onClick={() => {
                  const parent = currentDir.includes("/")
                    ? currentDir.slice(0, currentDir.lastIndexOf("/"))
                    : ""
                  setCurrentDir(parent)
                  setSelectedFile(null)
                }}
              >
                <TableCell className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <FolderIcon className="size-4" />
                  ..
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow
                key={entry.path}
                className={cn(
                  "cursor-pointer",
                  selectedFile?.path === entry.path && "bg-accent"
                )}
                onClick={() => handleNavigate(entry)}
              >
                <TableCell className="flex items-center gap-2 py-2 text-sm">
                  {entry.isDirectory ? (
                    <FolderIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <FileIcon className="size-4 text-muted-foreground" />
                  )}
                  {entry.name}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell className="py-8 text-center text-sm text-muted-foreground">
                  No files in this directory
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* File viewer */}
      {selectedFile && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 px-4 py-3">
            <FileIcon className="size-4 text-muted-foreground" />
            <CardTitle className="font-mono text-sm font-medium">
              {selectedFile.path}
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {selectedFile.content ? (
              isMarkdownFile(selectedFile.path) ? (
                <div className="p-6">
                  <MarkdownRenderer content={selectedFile.content} />
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
                    <code>{selectedFile.content}</code>
                  </pre>
                </ScrollArea>
              )
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No content available
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function OverviewTab({ agent, isOwner }: { agent: Agent; isOwner: boolean }) {
  const manifest = agent.manifest

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Manifest info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Configuration</CardTitle>
          <CardDescription>Agent manifest details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {manifest?.format && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Format</span>
              <Badge variant="outline" className="font-mono text-xs">
                {manifest.format}
              </Badge>
            </div>
          )}
          {manifest?.platform && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Platform</span>
              <Badge variant="secondary" className="text-xs">
                {manifest.platform}
              </Badge>
            </div>
          )}
          {manifest?.version && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono text-xs">{manifest.version}</span>
            </div>
          )}
          {manifest?.author && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Author</span>
              <span className="font-mono text-xs">@{manifest.author}</span>
            </div>
          )}
          {manifest?.modelPreferences?.primary && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Primary model</span>
              <span className="max-w-[200px] truncate text-xs">
                {manifest.modelPreferences.primary}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Stats</CardTitle>
          <CardDescription>Usage and activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Installs</span>
            <span className="font-mono">{agent.installs_count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Stars</span>
            <span className="font-mono">{agent.stars_count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Remixes</span>
            <span className="font-mono">{agent.remixes_count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created</span>
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 text-muted-foreground" />
              {new Date(agent.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Visibility</span>
            <Badge
              variant={agent.visibility === "public" ? "default" : "secondary"}
              className="text-xs"
            >
              {agent.visibility ?? "public"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Channels */}
      {manifest?.channels && manifest.channels.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Channels</CardTitle>
            <CardDescription>Supported communication channels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {manifest.channels.map((ch: string) => (
                <Badge key={ch} variant="secondary" className="text-xs">
                  {ch}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {manifest?.skills && manifest.skills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Skills</CardTitle>
            <CardDescription>Installed agent skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {manifest.skills.map((skill: string) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plugins */}
      {manifest?.plugins && manifest.plugins.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Plugins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {manifest.plugins.map((plugin: string) => (
                <Badge key={plugin} variant="secondary" className="text-xs">
                  {plugin}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Config variables (owner only) */}
      {isOwner &&
        manifest?.configVariables &&
        manifest.configVariables.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Config Variables</CardTitle>
              <CardDescription>
                Variables prompted during installation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {manifest.configVariables.map(
                  (cv: { key: string; label: string; required: boolean }) => (
                    <div
                      key={cv.key}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <code className="font-mono text-xs">{cv.key}</code>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {cv.label}
                        </span>
                        {cv.required && (
                          <Badge variant="destructive" className="text-[10px]">
                            required
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}

function SettingsTab({
  agent,
  profileUsername,
}: {
  agent: Agent
  profileUsername: string
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
      <div className="border-t pt-6">
        <AgentDeleteButton
          agentId={agent.id}
          agentName={agent.name}
          profileUsername={profileUsername}
        />
      </div>
    </div>
  )
}

function MarketplaceTab({
  agent,
  resources,
  allTags,
  selectedTagIds,
  profileUsername,
}: {
  agent: Agent
  resources: AgentResource[]
  allTags: Tag[]
  selectedTagIds: string[]
  profileUsername: string
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AgentTagManager
        agentId={agent.id}
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        profileUsername={profileUsername}
      />
      <div className="md:col-span-2">
        <AgentResourceUpload
          agentId={agent.id}
          resources={resources}
          profileUsername={profileUsername}
        />
      </div>
    </div>
  )
}

export function AgentDetailTabs({
  agent,
  files,
  isOwner,
  resources = [],
  allTags = [],
  selectedTagIds = [],
  profileUsername = "",
}: AgentDetailTabsProps) {
  const readmeFile = files.find((f) => /^readme\.md$/i.test(f.path))
  const hasReadme = !!(agent.readme || readmeFile?.content)

  return (
    <Tabs defaultValue={hasReadme ? "readme" : "content"} className="w-full">
      <TabsList>
        <TabsTrigger value="readme" className="gap-1.5">
          <BookOpen className="size-3.5" />
          README
        </TabsTrigger>
        <TabsTrigger value="content" className="gap-1.5">
          <FolderOpen className="size-3.5" />
          Content
        </TabsTrigger>
        <TabsTrigger value="overview" className="gap-1.5">
          <Settings2 className="size-3.5" />
          Overview
        </TabsTrigger>
        {isOwner && (
          <>
            <TabsTrigger value="settings" className="gap-1.5">
              <Wrench className="size-3.5" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="gap-1.5">
              <ShoppingBag className="size-3.5" />
              Marketplace
            </TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="readme">
        <ReadmeTab
          readme={agent.readme}
          files={files}
          isOwner={isOwner}
          agentId={agent.id}
          profileUsername={profileUsername}
        />
      </TabsContent>

      <TabsContent value="content">
        <ContentTab files={files} />
      </TabsContent>

      <TabsContent value="overview">
        <OverviewTab agent={agent} isOwner={isOwner} />
      </TabsContent>

      {isOwner && profileUsername && (
        <>
          <TabsContent value="settings">
            <SettingsTab agent={agent} profileUsername={profileUsername} />
          </TabsContent>

          <TabsContent value="marketplace">
            <MarketplaceTab
              agent={agent}
              resources={resources}
              allTags={allTags}
              selectedTagIds={selectedTagIds}
              profileUsername={profileUsername}
            />
          </TabsContent>
        </>
      )}
    </Tabs>
  )
}
