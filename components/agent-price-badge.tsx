import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface AgentPriceBadgeProps {
  priceCents: number
  currency?: string
  className?: string
}

export function AgentPriceBadge({
  priceCents,
  currency = "usd",
  className,
}: AgentPriceBadgeProps) {
  if (priceCents === 0) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "font-mono border border-emerald-500/30 bg-black/70 text-emerald-400 backdrop-blur-md shadow-sm",
          className
        )}
      >
        Free
      </Badge>
    )
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceCents / 100)

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-mono border border-white/20 bg-black/70 text-white backdrop-blur-md shadow-sm",
        className
      )}
    >
      {formatted}
    </Badge>
  )
}
