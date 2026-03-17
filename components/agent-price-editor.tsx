"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { DollarSign } from "lucide-react"
import { toast } from "sonner"

import type { AgentLicense } from "@/lib/types"
import { updateAgentPrice } from "@/app/actions/agent"
import { isFreeLicense, isPaidLicense } from "@/lib/license-utils"
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

interface AgentPriceEditorProps {
  agentId: string
  currentPriceCents: number
  currentLicense: AgentLicense | null
  currency: string
  profileUsername: string
}

export function AgentPriceEditor({
  agentId,
  currentPriceCents,
  currentLicense,
  currency,
  profileUsername,
}: AgentPriceEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFree, setIsFree] = useState(currentPriceCents === 0)
  const [dollars, setDollars] = useState(
    currentPriceCents > 0 ? (currentPriceCents / 100).toFixed(2) : ""
  )

  const hasLicenseConflict =
    currentLicense != null &&
    ((isFree && isPaidLicense(currentLicense)) ||
      (!isFree && isFreeLicense(currentLicense)))

  const handleSave = () => {
    const cents = isFree ? 0 : Math.round(parseFloat(dollars || "0") * 100)
    if (!isFree && (isNaN(cents) || cents < 0)) {
      toast.error("Enter a valid price")
      return
    }

    startTransition(async () => {
      const result = await updateAgentPrice(agentId, cents, profileUsername)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Price updated")
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <DollarSign className="size-4" />
          Pricing
        </CardTitle>
        <CardDescription className="text-xs">
          Set the price for your agent or keep it free.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant={isFree ? "default" : "outline"}
            size="sm"
            onClick={() => setIsFree(true)}
          >
            Free
          </Button>
          <Button
            variant={!isFree ? "default" : "outline"}
            size="sm"
            onClick={() => setIsFree(false)}
          >
            Paid
          </Button>
        </div>

        {!isFree && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={dollars}
              onChange={(e) => setDollars(e.target.value)}
              className="w-28"
            />
            <Badge variant="secondary" className="font-mono text-xs uppercase">
              {currency}
            </Badge>
          </div>
        )}

        {hasLicenseConflict && (
          <p className="text-xs text-destructive">
            Current license ({currentLicense}) is not compatible with{" "}
            {isFree ? "free" : "paid"} pricing. Change the license first.
          </p>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleSave}
          disabled={isPending || hasLicenseConflict}
        >
          {isPending ? "Saving..." : "Save Price"}
        </Button>
      </CardContent>
    </Card>
  )
}
