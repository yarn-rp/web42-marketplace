"use client"

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

interface StarRatingFilterProps {
  value: string
  onChange: (value: string) => void
}

export function StarRatingFilter({ value, onChange }: StarRatingFilterProps) {
  return (
    <Select value={value || "any"} onValueChange={(v) => onChange(v === "any" ? "" : v)}>
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
