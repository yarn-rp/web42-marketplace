"use client"

import { useEffect, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const [platform, setPlatform] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minStars, setMinStars] = useState("")
  const [publishedFrom, setPublishedFrom] = useState("")
  const [creator, setCreator] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPlatform(searchParams.get("platform"))
      setCategory(searchParams.get("category"))
      setMinPrice(searchParams.get("minPrice") ?? "")
      setMaxPrice(searchParams.get("maxPrice") ?? "")
      setMinStars(searchParams.get("minStars") ?? "")
      setPublishedFrom(searchParams.get("publishedFrom") ?? "")
      setCreator(searchParams.get("creator"))
    }
  }, [open, searchParams])

  const activeCategory = searchParams.get("category")
  const activePlatform = searchParams.get("platform")
  const activeMinPrice = searchParams.get("minPrice")
  const activeMaxPrice = searchParams.get("maxPrice")
  const activeMinStars = searchParams.get("minStars")
  const activePublishedFrom = searchParams.get("publishedFrom")
  const activeCreator = searchParams.get("creator")

  const activeCount =
    (activeCategory ? 1 : 0) +
    (activePlatform ? 1 : 0) +
    (activeMinPrice || activeMaxPrice ? 1 : 0) +
    (activeMinStars ? 1 : 0) +
    (activePublishedFrom ? 1 : 0) +
    (activeCreator ? 1 : 0)

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")

    if (platform) params.set("platform", platform)
    else params.delete("platform")

    if (category) params.set("category", category)
    else params.delete("category")

    let finalMin = minPrice
    let finalMax = maxPrice
    if (minPrice && maxPrice && parseInt(minPrice, 10) > parseInt(maxPrice, 10)) {
      finalMin = maxPrice
      finalMax = minPrice
    }
    if (finalMin) params.set("minPrice", finalMin)
    else params.delete("minPrice")
    if (finalMax) params.set("maxPrice", finalMax)
    else params.delete("maxPrice")

    if (minStars) params.set("minStars", minStars)
    else params.delete("minStars")

    if (publishedFrom) params.set("publishedFrom", publishedFrom)
    else params.delete("publishedFrom")

    if (creator) params.set("creator", creator)
    else params.delete("creator")

    router.replace(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

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
            <PlatformFilter value={platform} onChange={setPlatform} />
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
                  active={!category}
                  onClick={() => setCategory(null)}
                />
                {categories.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    category={cat}
                    active={category === cat.name}
                    onClick={() => setCategory(cat.name)}
                  />
                ))}
              </div>
            </div>
          )}
          <div>
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Price
            </Label>
            <PriceFilter
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
            />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Star rating
            </Label>
            <StarRatingFilter value={minStars} onChange={setMinStars} />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Published from
            </Label>
            <PublishedFromFilter value={publishedFrom} onChange={setPublishedFrom} />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Creator
            </Label>
            <CreatorFilter value={creator} onChange={setCreator} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
