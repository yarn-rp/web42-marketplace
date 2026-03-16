"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const starOptions = [
  { value: "", label: "Any" },
  { value: "3", label: "3+ stars" },
  { value: "5", label: "5+ stars" },
  { value: "10", label: "10+ stars" },
] as const

export function StarRatingFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("minStars") || ""

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    if (value) {
      params.set("minStars", value)
    } else {
      params.delete("minStars")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={current || "any"} onValueChange={(v) => handleChange(v === "any" ? "" : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Star rating" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="any">Any</SelectItem>
        {starOptions.filter((o) => o.value).map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
