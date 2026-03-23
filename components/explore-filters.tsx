"use client"

import { useEffect, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
import { CreatorFilter } from "@/components/creator-filter"
import { PlatformFilter } from "@/components/platform-filter"
import { PublishedFromFilter } from "@/components/published-from-filter"
import { StarRatingFilter } from "@/components/star-rating-filter"

interface ExploreFiltersProps {}

export function ExploreFilters({}: ExploreFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const [platform, setPlatform] = useState<string | null>(null)
  const [minStars, setMinStars] = useState("")
  const [publishedFrom, setPublishedFrom] = useState("")
  const [creator, setCreator] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPlatform(searchParams.get("platform"))
      setMinStars(searchParams.get("minStars") ?? "")
      setPublishedFrom(searchParams.get("publishedFrom") ?? "")
      setCreator(searchParams.get("creator"))
    }
  }, [open, searchParams])

  const activePlatform = searchParams.get("platform")
  const activeMinStars = searchParams.get("minStars")
  const activePublishedFrom = searchParams.get("publishedFrom")
  const activeCreator = searchParams.get("creator")

  const activeCount =
    (activePlatform ? 1 : 0) +
    (activeMinStars ? 1 : 0) +
    (activePublishedFrom ? 1 : 0) +
    (activeCreator ? 1 : 0)

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")

    if (platform) params.set("platform", platform)
    else params.delete("platform")

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
