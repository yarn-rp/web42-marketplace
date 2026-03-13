"use client"

import { useState } from "react"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { useSearchParams } from "next/navigation"

import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CategoryPill } from "@/components/category-pill"
import { PlatformFilter } from "@/components/platform-filter"

interface ExploreFiltersProps {
  categories: Category[]
}

export function ExploreFilters({ categories }: ExploreFiltersProps) {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get("category")
  const activePlatform = searchParams.get("platform")
  const activeCount =
    (activeCategory ? 1 : 0) + (activePlatform ? 1 : 0)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 size-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {activeCount}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              open && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Platform
          </p>
          <PlatformFilter />
        </div>
        {categories.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              <CategoryPill
                category={{
                  id: "all",
                  name: "All",
                  icon: null,
                  created_at: "",
                }}
                active={!activeCategory}
              />
              {categories.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  category={cat}
                  active={activeCategory === cat.name}
                />
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
