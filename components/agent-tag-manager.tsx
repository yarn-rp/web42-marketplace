"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Tag as TagIcon, X } from "lucide-react"
import { toast } from "sonner"

import type { Tag } from "@/lib/types"
import { updateAgentTags } from "@/app/actions/agent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AgentTagManagerProps {
  agentId: string
  allTags: Tag[]
  selectedTagIds: string[]
  profileUsername: string
}

export function AgentTagManager({
  agentId,
  allTags,
  selectedTagIds,
  profileUsername,
}: AgentTagManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedTagIds))

  const toggleTag = (tagId: string) => {
    const next = new Set(selected)
    if (next.has(tagId)) {
      next.delete(tagId)
    } else {
      next.add(tagId)
    }
    setSelected(next)

    startTransition(async () => {
      const result = await updateAgentTags(
        agentId,
        Array.from(next),
        profileUsername
      )
      if (result.error) {
        toast.error(result.error)
        setSelected(new Set(selectedTagIds))
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TagIcon className="size-4" />
          Tags
        </CardTitle>
        <CardDescription className="text-xs">
          Select at least 1 tag to categorize your agent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => {
            const isSelected = selected.has(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                disabled={isPending}
                className="focus-visible:outline-none"
              >
                <Badge
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer select-none text-xs transition-colors"
                >
                  {tag.name}
                  {isSelected && <X className="ml-1 size-3" />}
                </Badge>
              </button>
            )
          })}
          {allTags.length === 0 && (
            <p className="text-xs text-muted-foreground">No tags available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
