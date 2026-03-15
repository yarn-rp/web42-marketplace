"use client"

import { useState, useTransition } from "react"
import { RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { requestRefund } from "@/app/actions/stripe"
import { isRefundEligible, getRefundDeadline } from "@/lib/stripe-utils"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface RefundButtonProps {
  orderId: string
  orderCreatedAt: string
  amountCents: number
}

export function RefundButton({
  orderId,
  orderCreatedAt,
  amountCents,
}: RefundButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const eligible = isRefundEligible(orderCreatedAt)
  const deadline = getRefundDeadline(orderCreatedAt)

  if (!eligible) return null

  const handleRefund = () => {
    startTransition(async () => {
      const result = await requestRefund(orderId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Refund processed successfully")
        router.refresh()
      }
      setOpen(false)
    })
  }

  const hoursLeft = Math.ceil(
    (deadline.getTime() - Date.now()) / (1000 * 60 * 60)
  )
  const timeLeft =
    hoursLeft >= 24
      ? `${Math.ceil(hoursLeft / 24)} day${Math.ceil(hoursLeft / 24) !== 1 ? "s" : ""}`
      : `${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}`

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <RotateCcw className="size-3.5" />
          Refund
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Request a refund?</AlertDialogTitle>
          <AlertDialogDescription>
            You will receive a full refund of ${(amountCents / 100).toFixed(2)}{" "}
            and lose access to this agent. You have {timeLeft} remaining
            in the refund window.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRefund} disabled={isPending}>
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
  )
}
