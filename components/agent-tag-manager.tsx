"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, Loader2, Plus, Tag as TagIcon, X } from "lucide-react"
import { toast } from "sonner"

import type { Tag } from "@/lib/types"
import { createTagAndAssign, updateAgentTags } from "@/app/actions/agent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const MAX_TAGS = 8
const DEFAULT_VISIBLE_SUGGESTIONS = 8

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
  const [knownTags, setKnownTags] = useState<Tag[]>(allTags)
  const [inputValue, setInputValue] = useState("")
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)

  const selectedTags = knownTags.filter((t) => selected.has(t.id))
  const atLimit = selected.size >= MAX_TAGS

  const unselectedTags = knownTags.filter((t) => !selected.has(t.id))
  const visibleSuggestions = showAllSuggestions
    ? unselectedTags
    : unselectedTags.slice(0, DEFAULT_VISIBLE_SUGGESTIONS)
  const hasMoreSuggestions = unselectedTags.length > DEFAULT_VISIBLE_SUGGESTIONS

  const removeTag = (tagId: string) => {
    const next = new Set(selected)
    next.delete(tagId)
    setSelected(next)

    startTransition(async () => {
      const result = await updateAgentTags(agentId, Array.from(next), profileUsername)
      if (result.error) {
        toast.error(result.error)
        setSelected(new Set(selectedTagIds))
      } else {
        router.refresh()
      }
    })
  }

  const addExistingTag = (tagId: string) => {
    if (atLimit) return
    const next = new Set(selected)
    next.add(tagId)
    setSelected(next)

    startTransition(async () => {
      const result = await updateAgentTags(agentId, Array.from(next), profileUsername)
      if (result.error) {
        toast.error(result.error)
        setSelected(new Set(selectedTagIds))
      } else {
        router.refresh()
      }
    })
  }

  const addNewTag = () => {
    const trimmed = inputValue.trim().toLowerCase()
    if (!trimmed) return
    if (atLimit) {
      toast.error(`Maximum of ${MAX_TAGS} tags allowed`)
      return
    }

    const existingMatch = knownTags.find(
      (t) => t.name.toLowerCase() === trimmed
    )

    if (existingMatch) {
      if (selected.has(existingMatch.id)) {
        toast.info("Tag already added")
        setInputValue("")
        return
      }
      setInputValue("")
      addExistingTag(existingMatch.id)
      return
    }

    setInputValue("")
    startTransition(async () => {
      const result = await createTagAndAssign(agentId, trimmed, profileUsername)
      if (result.error) {
        toast.error(result.error)
      } else if (result.tag) {
        setKnownTags((prev) =>
          prev.some((t) => t.id === result.tag!.id)
            ? prev
            : [...prev, result.tag as Tag]
        )
        setSelected((prev) => new Set([...prev, result.tag!.id]))
        router.refresh()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addNewTag()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TagIcon className="size-4" />
          Tags
        </CardTitle>
        <CardDescription className="text-xs">
          Add up to {MAX_TAGS} tags to categorize your agent. Type a custom tag or pick from suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <Badge key={tag.id} variant="default" className="select-none text-xs">
                {tag.name}
                <button
                  onClick={() => removeTag(tag.id)}
                  disabled={isPending}
                  className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder={atLimit ? `Limit of ${MAX_TAGS} tags reached` : "Type a new tag..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending || atLimit}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addNewTag}
            disabled={isPending || atLimit || !inputValue.trim()}
            className="h-8 shrink-0"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
          </Button>
        </div>

        {visibleSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Suggestions</p>
            <div className="flex flex-wrap gap-1.5">
              {visibleSuggestions.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addExistingTag(tag.id)}
                  disabled={isPending || atLimit}
                  className="focus-visible:outline-none"
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer select-none text-xs transition-colors hover:bg-accent"
                  >
                    {tag.name}
                    <Plus className="ml-1 size-3 opacity-50" />
                  </Badge>
                </button>
              ))}
            </div>
            {hasMoreSuggestions && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => setShowAllSuggestions((v) => !v)}
              >
                {showAllSuggestions ? (
                  <>
                    <ChevronUp className="mr-1 size-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 size-3" />
                    Show all ({unselectedTags.length})
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {selected.size > 0 && (
          <p className="text-xs text-muted-foreground">
            {selected.size}/{MAX_TAGS} tags used
          </p>
        )}
      </CardContent>
    </Card>
  )
}
