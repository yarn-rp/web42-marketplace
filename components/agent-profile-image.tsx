"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/db/supabase/client"
import { cn } from "@/lib/utils"
import { updateAgentProfileImage } from "@/app/actions/agent"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AgentProfileImageProps {
  agentId: string
  currentImageUrl: string | null
  profileUsername: string
}

const ACCEPTED = "image/png,image/jpeg,image/webp"
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export function AgentProfileImage({
  agentId,
  currentImageUrl,
  profileUsername,
}: AgentProfileImageProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(currentImageUrl)

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > MAX_SIZE) {
        toast.error("Image must be under 2MB")
        return
      }

      setIsUploading(true)
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      try {
        const supabase = createClient()
        const ext = file.name.split(".").pop() ?? "png"
        const storagePath = `${agentId}/profile.${ext}`

        const { data, error: uploadError } = await supabase.storage
          .from("agent-covers")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: true,
          })

        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}`)
          setPreview(currentImageUrl)
          return
        }

        const { data: urlData } = supabase.storage
          .from("agent-covers")
          .getPublicUrl(data.path)

        const result = await updateAgentProfileImage(
          agentId,
          urlData.publicUrl,
          profileUsername
        )

        if (result.error) {
          toast.error(result.error)
          setPreview(currentImageUrl)
        } else {
          setPreview(urlData.publicUrl)
          toast.success("Profile image updated")
          router.refresh()
        }
      } catch {
        toast.error("Upload failed")
        setPreview(currentImageUrl)
      } finally {
        setIsUploading(false)
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [agentId, currentImageUrl, profileUsername, router]
  )

  const handleRemove = () => {
    startTransition(async () => {
      const result = await updateAgentProfileImage(agentId, null, profileUsername)
      if (result.error) {
        toast.error(result.error)
      } else {
        setPreview(null)
        toast.success("Profile image removed")
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Profile Image</CardTitle>
        <CardDescription className="text-xs">
          Square 1:1 image (PNG, WebP, or JPEG, max 2MB)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed",
              preview ? "border-transparent" : "border-muted-foreground/25"
            )}
          >
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="size-full object-cover"
              />
            ) : (
              <Camera className="size-6 text-muted-foreground/40" />
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading || isPending}
            >
              <Upload className="mr-2 size-3.5" />
              {preview ? "Replace" : "Upload"}
            </Button>
            {preview && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleRemove}
                disabled={isUploading || isPending}
              >
                <Trash2 className="mr-2 size-3.5" />
                Remove
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </CardContent>
    </Card>
  )
}
