"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const publishedOptions = [
  { value: "", label: "Any time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const

interface PublishedFromFilterProps {
  value: string
  onChange: (value: string) => void
}

export function PublishedFromFilter({ value, onChange }: PublishedFromFilterProps) {
  return (
    <Select value={value || "any"} onValueChange={(v) => onChange(v === "any" ? "" : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Published" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="any">Any time</SelectItem>
        {publishedOptions.filter((o) => o.value).map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
