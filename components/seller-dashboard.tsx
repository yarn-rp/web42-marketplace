"use client"

import { useState } from "react"
import { ExternalLink, Loader2, DollarSign, TrendingUp, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import type { Order } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface SellerDashboardProps {
  orders: Order[]
}

export function SellerDashboard({ orders }: SellerDashboardProps) {
  const [loadingDashboard, setLoadingDashboard] = useState(false)

  const totalRevenueCents = orders.reduce(
    (sum, o) => sum + o.seller_amount_cents,
    0
  )
  const totalSales = orders.length

  const last30Days = orders.filter((o) => {
    const created = new Date(o.created_at)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return created >= thirtyDaysAgo
  })
  const last30RevenueCents = last30Days.reduce(
    (sum, o) => sum + o.seller_amount_cents,
    0
  )

  const handleOpenDashboard = async () => {
    setLoadingDashboard(true)
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, "_blank")
      }
    } catch {
      toast.error("Failed to open Stripe dashboard")
    } finally {
      setLoadingDashboard(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="size-3.5" />
            Total Revenue
          </div>
          <p className="text-xl font-semibold">
            ${(totalRevenueCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="size-3.5" />
            Last 30 Days
          </div>
          <p className="text-xl font-semibold">
            ${(last30RevenueCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ShoppingBag className="size-3.5" />
            Total Sales
          </div>
          <p className="text-xl font-semibold">{totalSales}</p>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Sales</h4>
          <div className="space-y-1">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="truncate">
                  {(order as any).agent?.name ?? "Agent"}
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  +${(order.seller_amount_cents / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDashboard}
        disabled={loadingDashboard}
      >
        {loadingDashboard ? (
          <Loader2 className="size-4 animate-spin mr-2" />
        ) : (
          <ExternalLink className="size-4 mr-2" />
        )}
        Stripe Dashboard
      </Button>
    </div>
  )
}
