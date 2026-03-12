"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GitFork } from "lucide-react"

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
import { remixAgent } from "@/app/actions/agent"

interface RemixButtonProps {
  agentId: string
  agentName: string
  variant?: "default" | "outline" | "secondary"
}

export function RemixButton({
  agentId,
  agentName,
  variant = "default",
}: RemixButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleRemix = () => {
    setError(null)
    startTransition(async () => {
      const result = await remixAgent(agentId)
      if (result.error) {
        if (result.error === "Not authenticated") {
          router.push("/login")
          return
        }
        setError(result.error)
        return
      }
      setOpen(false)
      if (result.agent) {
        router.push("/dashboard")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1.5">
          <GitFork className="size-4" />
          Remix
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remix {agentName}?</DialogTitle>
          <DialogDescription>
            This will create a copy of this agent package under your account.
            You can then customize it and publish your own version.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRemix} disabled={isPending}>
            {isPending ? "Remixing..." : "Remix Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
