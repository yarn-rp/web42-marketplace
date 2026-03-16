"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  Circle,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Scale,
  Tag,
  Video,
  X,
} from "lucide-react"
import { toast } from "sonner"

import type { PublishValidation } from "@/app/actions/agent"
import { publishAgent, unpublishAgent } from "@/app/actions/agent"
import type { Agent } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface PublishDialogProps {
  agent: Agent
  validation: PublishValidation
  profileUsername: string
  variant?: "default" | "secondary" | "outline"
}

function ChecklistItem({
  label,
  passed,
  detail,
  hint,
  icon: Icon,
}: {
  label: string
  passed: boolean
  detail?: string
  hint?: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className={
          passed
            ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500"
            : "flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
      >
        {passed ? (
          <Check className="size-3.5" />
        ) : (
          <Circle className="size-3.5" />
        )}
      </div>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium">{label}</span>
        {detail && (
          <span className="ml-2 text-xs text-muted-foreground">{detail}</span>
        )}
        {!passed && hint && (
          <p className="text-xs text-muted-foreground/70">{hint}</p>
        )}
      </div>
      {passed ? (
        <Check className="size-4 shrink-0 text-emerald-500" />
      ) : (
        <X className="size-4 shrink-0 text-muted-foreground/50" />
      )}
    </div>
  )
}

export function PublishDialog({
  agent,
  validation,
  profileUsername,
  variant = "default",
}: PublishDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const isPublished = agent.visibility === "public"
  const allPassed =
    validation.readme &&
    validation.profileImage &&
    validation.resources &&
    validation.license &&
    validation.tags

  const passedCount = [
    validation.readme,
    validation.profileImage,
    validation.resources,
    validation.license,
    validation.tags,
  ].filter(Boolean).length

  const handlePublish = () => {
    setError(null)
    startTransition(async () => {
      const result = await publishAgent(agent.id, profileUsername)
      if (result.error) {
        setError(result.error)
        toast.error("Cannot publish: missing requirements")
      } else {
        toast.success("Agent published to marketplace")
        setOpen(false)
        router.refresh()
      }
    })
  }

  const handleUnpublish = () => {
    setError(null)
    startTransition(async () => {
      const result = await unpublishAgent(agent.id, profileUsername)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Agent unpublished from marketplace")
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isPublished ? (
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="size-3.5" />
            <Badge
              variant="secondary"
              className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15"
            >
              Live
            </Badge>
          </Button>
        ) : (
          <Button variant={variant} size="sm" className="gap-2">
            <Globe className="size-3.5" />
            Publish
            {!allPassed && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {passedCount}/5
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            {isPublished ? "Publishing Status" : "Publish to Marketplace"}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? "Your agent is live on the marketplace."
              : "Complete all requirements to publish your agent."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-0 divide-y">
          <ChecklistItem
            icon={FileText}
            label="README"
            passed={validation.readme}
            detail={validation.readme ? undefined : "At least 50 characters"}
            hint="Push a README via the CLI"
          />
          <ChecklistItem
            icon={ImageIcon}
            label="Profile image"
            passed={validation.profileImage}
            detail={validation.profileImage ? undefined : "1:1 square image"}
            hint="Upload in the Settings tab"
          />
          <ChecklistItem
            icon={Video}
            label="Resources"
            passed={validation.resources}
            detail={`${validation.resourceCount}/3 minimum`}
            hint="Upload in the Marketplace tab"
          />
          <ChecklistItem
            icon={Scale}
            label="License"
            passed={validation.license}
            detail={agent.license ?? undefined}
            hint="Select one in the Settings tab"
          />
          <ChecklistItem
            icon={Tag}
            label="Tags"
            passed={validation.tags}
            detail={validation.tags ? undefined : "At least 1 tag"}
            hint="Add tags in the Marketplace tab"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {!isPublished && (
          <p className="text-[11px] leading-snug text-muted-foreground">
            By publishing, you agree to our{" "}
            <Link href="/seller-agreement" className="underline underline-offset-2 hover:text-foreground">
              Seller Agreement
            </Link>
            {" and "}
            <Link href="/acceptable-use" className="underline underline-offset-2 hover:text-foreground">
              Acceptable Use Policy
            </Link>
            .
          </p>
        )}

        <DialogFooter>
          {isPublished ? (
            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Unpublish
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={isPending || !allPassed}
            >
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Publish to Marketplace
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
