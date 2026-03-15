"use client"

import { useState, useTransition, useMemo } from "react"
import {
  ExternalLink,
  Loader2,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import type { Order } from "@/lib/types"
import { issueSellerRefund } from "@/app/actions/stripe"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SellerDashboardProps {
  orders: Order[]
}

const INITIAL_VISIBLE = 10

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function SellerDashboard({ orders }: SellerDashboardProps) {
  const router = useRouter()
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [refundOrder, setRefundOrder] = useState<Order | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const [agentBreakdownOpen, setAgentBreakdownOpen] = useState(false)

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "completed"),
    [orders]
  )
  const refundedOrders = useMemo(
    () => orders.filter((o) => o.status === "refunded"),
    [orders]
  )

  const totalRevenueCents = completedOrders.reduce(
    (sum, o) => sum + o.seller_amount_cents,
    0
  )
  const totalSales = completedOrders.length

  const last30Days = completedOrders.filter((o) => {
    const created = new Date(o.created_at)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return created >= thirtyDaysAgo
  })
  const last30RevenueCents = last30Days.reduce(
    (sum, o) => sum + o.seller_amount_cents,
    0
  )

  const refundedAmountCents = refundedOrders.reduce(
    (sum, o) => sum + o.seller_amount_cents,
    0
  )

  const agentBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; revenue: number; sales: number; refunds: number }
    >()
    for (const order of orders) {
      const agentId = order.agent_id
      const name = (order as any).agent?.name ?? "Unknown Agent"
      const existing = map.get(agentId) || {
        name,
        revenue: 0,
        sales: 0,
        refunds: 0,
      }
      if (order.status === "completed") {
        existing.revenue += order.seller_amount_cents
        existing.sales += 1
      } else if (order.status === "refunded") {
        existing.refunds += 1
      }
      map.set(agentId, existing)
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [orders])

  const visibleOrders = showAll ? orders : orders.slice(0, INITIAL_VISIBLE)

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

  const handleRefund = () => {
    if (!refundOrder) return
    startTransition(async () => {
      const result = await issueSellerRefund(
        refundOrder.id,
        refundReason.trim() || undefined
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Refund processed successfully")
        router.refresh()
      }
      setRefundOrder(null)
      setRefundReason("")
    })
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="size-3.5" />
            Total Revenue
          </div>
          <p className="text-xl font-semibold">
            {formatCents(totalRevenueCents)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="size-3.5" />
            Last 30 Days
          </div>
          <p className="text-xl font-semibold">
            {formatCents(last30RevenueCents)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ShoppingBag className="size-3.5" />
            Total Sales
          </div>
          <p className="text-xl font-semibold">{totalSales}</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <RotateCcw className="size-3.5" />
            Refunded
          </div>
          <p className="text-xl font-semibold">
            {refundedOrders.length}
            {refundedOrders.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({formatCents(refundedAmountCents)})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Per-Agent Breakdown */}
      {agentBreakdown.length > 0 && (
        <>
          <Separator />
          <Collapsible
            open={agentBreakdownOpen}
            onOpenChange={setAgentBreakdownOpen}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full items-center justify-between px-0 hover:bg-transparent"
              >
                <h4 className="text-sm font-medium">Revenue by Agent</h4>
                {agentBreakdownOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Refunds</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentBreakdown.map((agent) => (
                    <TableRow key={agent.name}>
                      <TableCell className="font-medium">
                        {agent.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {agent.sales}
                      </TableCell>
                      <TableCell className="text-right">
                        {agent.refunds}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCents(agent.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      {/* Sales History */}
      {orders.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Sales History</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium truncate max-w-[140px]">
                      {(order as any).agent?.name ?? "Agent"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      @{(order as any).buyer?.username ?? "unknown"}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatCents(order.seller_amount_cents)}
                    </TableCell>
                    <TableCell>
                      {order.status === "completed" ? (
                        <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-600/20 hover:bg-emerald-600/15">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          Refunded
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-muted-foreground"
                          onClick={() => setRefundOrder(order)}
                        >
                          <RotateCcw className="size-3" />
                          Refund
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {orders.length > INITIAL_VISIBLE && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? "Show less"
                  : `Show all ${orders.length} orders`}
              </Button>
            )}
          </div>
        </>
      )}

      {/* Links */}
      <Separator />
      <div className="flex flex-wrap items-center gap-3">
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
          Manage on Stripe
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a
            href="https://support.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HelpCircle className="size-4 mr-2" />
            Stripe Support
          </a>
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <HelpCircle className="size-3.5" />
                Refund Policy
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-sm">
              Buyers can self-service refund within 72 hours of purchase.
              After that, they can contact you directly and you can issue a
              refund from this dashboard at any time.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Seller Refund Dialog */}
      <AlertDialog
        open={!!refundOrder}
        onOpenChange={(open) => {
          if (!open) {
            setRefundOrder(null)
            setRefundReason("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue a refund?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will refund{" "}
                  <span className="font-semibold text-foreground">
                    {refundOrder && formatCents(refundOrder.amount_cents)}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-foreground">
                    @{(refundOrder as any)?.buyer?.username ?? "the buyer"}
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold text-foreground">
                    {(refundOrder as any)?.agent?.name ?? "this agent"}
                  </span>
                  . The buyer will lose access and the transfer to your
                  account will be reversed.
                </p>
                <Textarea
                  placeholder="Reason for refund (optional)"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Confirm Refund"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
