import Link from "next/link"

import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface CategoryPillProps {
  category: Category
  active?: boolean
}

export function CategoryPill({ category, active }: CategoryPillProps) {
  const href =
    category.name === "All"
      ? "/explore"
      : `/explore?category=${category.name}`

  return (
    <Link href={href}>
      <Badge
        variant={active ? "default" : "outline"}
        className={cn(
          "cursor-pointer text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
          active && "hover:bg-primary/90"
        )}
      >
        {category.name}
      </Badge>
    </Link>
  )
}
