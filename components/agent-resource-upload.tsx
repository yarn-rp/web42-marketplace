"use client"

import { useCallback, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  GripVertical,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react"
import Dropzone from "react-dropzone"
import { toast } from "sonner"

import { createClient } from "@/db/supabase/client"
import type { AgentResource, AgentResourceType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  createAgentResource,
  deleteAgentResource,
} from "@/app/actions/agent"

interface AgentResourceUploadProps {
  agentId: string
  resources: AgentResource[]
  profileUsername: string
}

function getResourceType(file: File): AgentResourceType {
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("image/")) return "image"
  return "document"
}

const ACCEPTED_TYPES = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB for videos

export function AgentResourceUpload({
  agentId,
  resources,
  profileUsername,
}: AgentResourceUploadProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleUpload = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      setIsUploading(true)

      const supabase = createClient()

      try {
        for (const file of acceptedFiles) {
          const ext = file.name.split(".").pop() ?? ""
          const storagePath = `${agentId}/${Date.now()}-${file.name}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("agent-resources")
            .upload(storagePath, file, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            toast.error(`Failed to upload ${file.name}: ${uploadError.message}`)
            continue
          }

          const { data: urlData } = supabase.storage
            .from("agent-resources")
            .getPublicUrl(uploadData.path)

          const resourceType = getResourceType(file)
          const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")

          const result = await createAgentResource(
            agentId,
            {
              title,
              type: resourceType,
              url: urlData.publicUrl,
            },
            profileUsername
          )

          if (result.error) {
            toast.error(`Failed to save ${file.name}: ${result.error}`)
          }
        }

        toast.success(`${acceptedFiles.length} resource(s) uploaded`)
        router.refresh()
      } catch (err) {
        toast.error("Upload failed")
      } finally {
        setIsUploading(false)
      }
    },
    [agentId, profileUsername, router]
  )

  const handleDelete = (resourceId: string) => {
    setDeletingId(resourceId)
    startTransition(async () => {
      const result = await deleteAgentResource(resourceId, profileUsername)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Resource deleted")
        router.refresh()
      }
      setDeletingId(null)
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Resources</CardTitle>
        <CardDescription className="text-xs">
          Upload at least 3 resources (videos, images) showing how your agent works.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.length > 0 && (
          <div className="space-y-2">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                {resource.type === "video" ? (
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-muted">
                    <video
                      src={resource.url}
                      className="h-full w-full object-cover"
                      muted
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-muted">
                    <img
                      src={resource.url}
                      alt={resource.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{resource.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {resource.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(resource.id)}
                  disabled={deletingId === resource.id}
                >
                  {deletingId === resource.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dropzone
          onDrop={handleUpload}
          accept={ACCEPTED_TYPES}
          maxSize={MAX_FILE_SIZE}
          multiple
          disabled={isUploading}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition hover:bg-muted/25",
                isDragActive && "border-primary bg-muted/25",
                isUploading && "pointer-events-none opacity-60"
              )}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="size-6 text-muted-foreground" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {isDragActive
                    ? "Drop files here"
                    : "Drag & drop videos or images"}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  MP4, WebM, MOV, PNG, JPG, WebP (up to 100MB)
                </p>
              </div>
            </div>
          )}
        </Dropzone>
      </CardContent>
    </Card>
  )
}
