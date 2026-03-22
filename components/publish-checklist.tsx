"use client"

import { useState, useTransition } from "react"
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
import { getMarketplaceExtension } from "@/lib/agent-card-utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PublishChecklistProps {
  agent: Agent
  validation: PublishValidation
  profileUsername: string
}

function ChecklistItem({
  label,
  passed,
  detail,
  icon: Icon,
}: {
  label: string
  passed: boolean
  detail?: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className={
          passed
            ? "flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500"
            : "flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
      >
        {passed ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
      </div>
      <Icon className="size-4 text-muted-foreground" />
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
        {detail && (
          <span className="ml-2 text-xs text-muted-foreground">{detail}</span>
        )}
      </div>
      {passed ? (
        <Check className="size-4 text-emerald-500" />
      ) : (
        <X className="size-4 text-muted-foreground/50" />
      )}
    </div>
  )
}

export function PublishChecklist({
  agent,
  validation,
  profileUsername,
}: PublishChecklistProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const mktExt = getMarketplaceExtension(agent.agent_card)
  const isPublished = (mktExt?.visibility ?? "public") === "public" && !!agent.published_at
  const isFree = validation.isFree

  const requiredChecks = isFree
    ? [validation.readme, validation.license, validation.tags]
    : [
        validation.readme,
        validation.profileImage,
        validation.resources,
        validation.license,
        validation.tags,
      ]

  const allPassed = requiredChecks.every(Boolean)

  const handlePublish = () => {
    setError(null)
    startTransition(async () => {
      const result = await publishAgent(agent.id, profileUsername)
      if (result.error) {
        setError(result.error)
        toast.error("Cannot publish: missing requirements")
      } else {
        toast.success("Agent published to marketplace")
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
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Globe className="size-4" />
          <CardTitle className="text-sm">Publishing</CardTitle>
          {isPublished && (
            <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-500">
              Live
            </span>
          )}
          {!isPublished && (
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Private
            </span>
          )}
        </div>
        <CardDescription className="text-xs">
          {isPublished
            ? "Your agent is live on the marketplace."
            : "Complete all requirements to publish."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0 divide-y">
        <ChecklistItem
          icon={FileText}
          label="README"
          passed={validation.readme}
          detail={validation.readme ? undefined : "At least 50 characters"}
        />
        {!isFree && (
          <ChecklistItem
            icon={ImageIcon}
            label="Profile image"
            passed={validation.profileImage}
            detail={validation.profileImage ? undefined : "1:1 square image"}
          />
        )}
        {!isFree && (
          <ChecklistItem
            icon={Video}
            label="Resources"
            passed={validation.resources}
            detail={`${validation.resourceCount}/3 minimum`}
          />
        )}
        <ChecklistItem
          icon={Scale}
          label="License"
          passed={validation.license}
          detail={mktExt?.license ?? undefined}
        />
        <ChecklistItem
          icon={Tag}
          label="Tags"
          passed={validation.tags}
          detail={validation.tags ? undefined : "At least 1 tag"}
        />
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-3">
        {error && (
          <p className="w-full text-xs text-destructive">{error}</p>
        )}
        {isPublished ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleUnpublish}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Unpublish
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={handlePublish}
            disabled={isPending || !allPassed}
          >
            {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Publish to Marketplace
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
