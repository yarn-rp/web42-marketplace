import Link from "next/link"

import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface CategoryPillProps {
  category: Category
  active?: boolean
  onClick?: () => void
}

export function CategoryPill({ category, active, onClick }: CategoryPillProps) {
  const content = (
    <Badge
      variant={active ? "default" : "outline"}
      className={cn(
        "cursor-pointer text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "hover:bg-primary/90"
      )}
    >
      {category.name}
    </Badge>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick}>
        {content}
      </button>
    )
  }

  const href =
    category.name === "All" ? "/explore" : `/explore?category=${category.name}`
  return <Link href={href}>{content}</Link>
}
