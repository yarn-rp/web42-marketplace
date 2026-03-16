import Link from "next/link"

import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface CategoryPillProps {
  category: Category
  active?: boolean
  preserveParams?: URLSearchParams
}

export function CategoryPill({ category, active, preserveParams }: CategoryPillProps) {
  const href = preserveParams
    ? (() => {
        const params = new URLSearchParams(preserveParams.toString())
        params.delete("page")
        if (category.name === "All") {
          params.delete("category")
        } else {
          params.set("category", category.name)
        }
        const qs = params.toString()
        return `/explore${qs ? `?${qs}` : ""}`
      })()
    : category.name === "All"
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
