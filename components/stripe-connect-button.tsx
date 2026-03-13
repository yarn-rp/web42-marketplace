"use client"

import { useState } from "react"
import { ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

interface StripeConnectButtonProps {
  stripeAccountId: string | null
  onboardingComplete: boolean
  payoutsEnabled: boolean
}

export function StripeConnectButton({
  stripeAccountId,
  onboardingComplete,
  payoutsEnabled,
}: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" })
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      window.location.href = data.url
    } catch {
      toast.error("Failed to connect with Stripe")
    } finally {
      setLoading(false)
    }
  }

  const handleDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error("Failed to open Stripe dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (payoutsEnabled) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          <span>Stripe connected — payouts enabled</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleDashboard} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <ExternalLink className="size-4 mr-2" />
          )}
          Manage on Stripe
        </Button>
      </div>
    )
  }

  if (stripeAccountId && onboardingComplete) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="size-4" />
          <span>Stripe connected — payouts pending verification</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleDashboard} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <ExternalLink className="size-4 mr-2" />
          )}
          Check Status on Stripe
        </Button>
      </div>
    )
  }

  if (stripeAccountId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="size-4" />
          <span>Stripe onboarding incomplete — finish setup to receive payouts</span>
        </div>
        <Button onClick={handleConnect} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin mr-2" />}
          Complete Stripe Setup
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect a Stripe account to receive payments when buyers purchase your
        agents. Web42 takes a 10% platform fee on each sale.
      </p>
      <Button onClick={handleConnect} disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin mr-2" />}
        Connect with Stripe
      </Button>
    </div>
  )
}
