"use client"

import { useOptimistic, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { starAgent, unstarAgent } from "@/app/actions/agent"

interface StarButtonProps {
  agentId: string
  initialStarred: boolean
  initialCount: number
}

export function StarButton({
  agentId,
  initialStarred,
  initialCount,
}: StarButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(
    { starred: initialStarred, count: initialCount },
    (state, newStarred: boolean) => ({
      starred: newStarred,
      count: newStarred ? state.count + 1 : Math.max(state.count - 1, 0),
    })
  )

  const handleToggle = () => {
    startTransition(async () => {
      setOptimistic(!optimistic.starred)
      if (optimistic.starred) {
        const result = await unstarAgent(agentId)
        if (result.error) router.push("/login")
      } else {
        const result = await starAgent(agentId)
        if (result.error) router.push("/login")
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className="gap-1.5"
    >
      <Star
        className={cn(
          "size-4",
          optimistic.starred && "fill-yellow-400 text-yellow-400"
        )}
      />
      <span>{optimistic.count}</span>
    </Button>
  )
}
