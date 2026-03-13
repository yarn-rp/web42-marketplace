"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ShoppingCart, Loader2 } from "lucide-react"
import { toast } from "sonner"

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

  const isFree = priceCents === 0
  const label = isFree
    ? "Get for Free"
    : `Get — $${(priceCents / 100).toFixed(2)}`

  const handleGet = () => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    startTransition(async () => {
      if (isFree) {
        const result = await acquireAgent(agentId)
        if (result.error) {
          if (result.error === "Not authenticated") {
            router.push("/login")
            return
          }
          toast.error(result.error)
          return
        }
        router.refresh()
      } else {
        try {
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentId }),
          })
          const data = await res.json()

          if (data.error) {
            toast.error(data.error)
            return
          }

          if (data.url) {
            window.location.href = data.url
          }
        } catch {
          toast.error("Failed to start checkout")
        }
      }
    })
  }

  return (
    <Button size="sm" className="gap-1.5" onClick={handleGet} disabled={isPending}>
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ShoppingCart className="size-4" />
      )}
      {isPending ? (isFree ? "Getting..." : "Redirecting...") : label}
    </Button>
  )
}
