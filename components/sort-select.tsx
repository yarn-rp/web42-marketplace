"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { SortOption } from "@/app/actions/agent"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "stars", label: "Most Stars" },
  { value: "interactions", label: "Most Interactions" },
  { value: "recent", label: "Newest" },
]

export function SortSelect({ current }: { current?: SortOption }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={current ?? "trending"} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
