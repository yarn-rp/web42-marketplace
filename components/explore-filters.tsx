"use client"

import { useEffect, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { useSearchParams } from "next/navigation"

import type { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CategoryPill } from "@/components/category-pill"
import { CreatorFilter } from "@/components/creator-filter"
import { PlatformFilter } from "@/components/platform-filter"
import { PriceFilter } from "@/components/price-filter"
import { PublishedFromFilter } from "@/components/published-from-filter"
import { StarRatingFilter } from "@/components/star-rating-filter"

interface ExploreFiltersProps {
  categories: Category[]
}

export function ExploreFilters({ categories }: ExploreFiltersProps) {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get("category")
  const activePlatform = searchParams.get("platform")
  const activePrice = searchParams.get("price")
  const activeMinStars = searchParams.get("minStars")
  const activePublishedFrom = searchParams.get("publishedFrom")
  const activeCreator = searchParams.get("creator")

  const activeCount =
    (activeCategory ? 1 : 0) +
    (activePlatform ? 1 : 0) +
    (activePrice && activePrice !== "all" ? 1 : 0) +
    (activeMinStars ? 1 : 0) +
    (activePublishedFrom ? 1 : 0) +
    (activeCreator ? 1 : 0)

  useEffect(() => {
    setOpen(false)
  }, [searchParams.toString()])

  const preserveParams = searchParams

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-[160px] justify-between gap-2"
        >
          <SlidersHorizontal className="size-4 shrink-0" />
          {activeCount > 0 ? `Filters (${activeCount})` : "Filters"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Refine your search by platform, category, price, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <div>
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Platform
            </Label>
            <PlatformFilter />
          </div>
          {categories.length > 0 && (
            <div>
              <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Category
              </Label>
              <div className="flex flex-wrap gap-2">
                <CategoryPill
                  category={{
                    id: "all",
                    name: "All",
                    icon: null,
                    created_at: "",
                  }}
                  active={!activeCategory}
                  preserveParams={preserveParams}
                />
                {categories.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    category={cat}
                    active={activeCategory === cat.name}
                    preserveParams={preserveParams}
                  />
                ))}
              </div>
            </div>
          )}
          <div>
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Price
            </Label>
            <PriceFilter />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Star rating
            </Label>
            <StarRatingFilter />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Published from
            </Label>
            <PublishedFromFilter />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Creator
            </Label>
            <CreatorFilter />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
