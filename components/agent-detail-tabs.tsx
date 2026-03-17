"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { MDXEditorMethods } from "@mdxeditor/editor"
import {
  BookOpen,
  FileIcon,
  FolderIcon,
  FolderOpen,
  Loader2,
  Lock,
  Pencil,
  Sparkles,
  Wrench,
  X,
} from "lucide-react"
import { toast } from "sonner"

import type {
  Agent,
  AgentFile,
  AgentResource,
  SkillEntry,
  Tag,
} from "@/lib/types"
import { updateAgentReadme } from "@/app/actions/agent"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { AgentDetailsEditor } from "./agent-details-editor"
import { AgentLicenseSelect } from "./agent-license-select"
import { AgentPriceEditor } from "./agent-price-editor"
import { AgentProfileImage } from "./agent-profile-image"
import { AgentResourceUpload } from "./agent-resource-upload"
import { AgentTagManager } from "./agent-tag-manager"
import { ForwardRefEditor } from "./forward-ref-editor"
import { MarkdownRenderer } from "./markdown-renderer"

interface AgentDetailTabsProps {
  agent: Agent
  files: AgentFile[]
  isOwner: boolean
  hasAccess: boolean
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
  const editorRef = useRef<MDXEditorMethods>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const readmeContent =
    readme ||
    files.find((f) => /^readme\.md$/i.test(f.path))?.content

  const handleSave = () => {
    const draft = editorRef.current?.getMarkdown() ?? ""
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
          <div className="mdxeditor-wrapper [&_.mdxeditor]:border-0 [&_.mdxeditor]:bg-background [&_.mdxeditor-toolbar]:bg-muted/50 [&_.mdxeditor-toolbar]:border-b [&_.mdxeditor-toolbar]:border-border [&_.mdxeditor-root-contenteditable]:min-h-[400px] [&_.mdxeditor-root-contenteditable]:px-6 [&_.mdxeditor-root-contenteditable]:py-4">
            <ForwardRefEditor
              ref={editorRef}
              markdown={readmeContent ?? ""}
              contentEditableClassName="prose prose-sm dark:prose-invert max-w-none"
              onChange={() => {}}
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
            onClick={() => setIsEditing(true)}
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

function SkillsTab({
  skills,
}: {
  skills: (SkillEntry | string)[]
}) {
  const normalized = (skills ?? []).map((s) =>
    typeof s === "string" ? { name: s, description: "" } : s
  )
  if (normalized.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Sparkles className="mb-3 size-10 opacity-40" />
        <p className="text-sm">No skills available for this agent.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {normalized.map((skill) => (
        <Card key={skill.name}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{skill.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {skill.description || `Skill: ${skill.name}`}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
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

function AgentDetailsTab({
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
    <div className="space-y-6">
      <AgentDetailsEditor
        agentId={agent.id}
        currentName={agent.name}
        currentDescription={agent.description}
        profileUsername={profileUsername}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <AgentProfileImage
          agentId={agent.id}
          currentImageUrl={agent.profile_image_url}
          profileUsername={profileUsername}
        />
        <AgentLicenseSelect
          agentId={agent.id}
          currentLicense={agent.license}
          priceCents={agent.price_cents ?? 0}
          profileUsername={profileUsername}
        />
        <AgentPriceEditor
          agentId={agent.id}
          currentPriceCents={agent.price_cents ?? 0}
          currentLicense={agent.license}
          currency={agent.currency ?? "usd"}
          profileUsername={profileUsername}
        />
      </div>
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

export function AgentDetailTabs({
  agent,
  files,
  isOwner,
  hasAccess,
  resources = [],
  allTags = [],
  selectedTagIds = [],
  profileUsername = "",
}: AgentDetailTabsProps) {
  const readmeFile = files.find((f) => /^readme\.md$/i.test(f.path))
  const hasReadme = !!(agent.readme || readmeFile?.content)
  const hasSkills = (agent.manifest?.skills ?? []).length > 0
  const defaultTab = hasReadme ? "readme" : hasSkills ? "skills" : "content"

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList>
        <TabsTrigger value="readme" className="gap-1.5">
          <BookOpen className="size-3.5" />
          README
        </TabsTrigger>
        <TabsTrigger value="skills" className="gap-1.5">
          <Sparkles className="size-3.5" />
          Skills
        </TabsTrigger>
        <TabsTrigger value="content" className="gap-1.5">
          <FolderOpen className="size-3.5" />
          Content
        </TabsTrigger>
        {isOwner && (
          <TabsTrigger value="agent-details" className="gap-1.5">
            <Wrench className="size-3.5" />
            Agent Details
          </TabsTrigger>
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

      <TabsContent value="skills">
        <SkillsTab skills={agent.manifest?.skills ?? []} />
      </TabsContent>

      <TabsContent value="content">
        {isOwner || hasAccess ? (
          <ContentTab files={files} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Lock className="mb-3 size-10 opacity-40" />
            <p className="text-sm">Get this agent to view its content.</p>
          </div>
        )}
      </TabsContent>

      {isOwner && profileUsername && (
        <TabsContent value="agent-details">
          <AgentDetailsTab
            agent={agent}
            resources={resources}
            allTags={allTags}
            selectedTagIds={selectedTagIds}
            profileUsername={profileUsername}
          />
        </TabsContent>
      )}
    </Tabs>
  )
}
