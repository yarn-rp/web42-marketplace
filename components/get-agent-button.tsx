"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ShoppingCart } from "lucide-react"

import { acquireAgent } from "@/app/actions/agent"
import { Button } from "@/components/ui/button"

interface GetAgentButtonProps {
  agentId: string
  priceCents: number
  isAuthenticated: boolean
}

export function GetAgentButton({
  agentId,
  priceCents,
  isAuthenticated,
}: GetAgentButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const label = priceCents > 0
    ? `Get — $${(priceCents / 100).toFixed(2)}`
    : "Get for Free"

  const handleGet = () => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    startTransition(async () => {
      const result = await acquireAgent(agentId)
      if (result.error) {
        if (result.error === "Not authenticated") {
          router.push("/login")
          return
        }
        console.error("Failed to acquire agent:", result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <Button size="sm" className="gap-1.5" onClick={handleGet} disabled={isPending}>
      <ShoppingCart className="size-4" />
      {isPending ? "Getting..." : label}
    </Button>
  )
}
