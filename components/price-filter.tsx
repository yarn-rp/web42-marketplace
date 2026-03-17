"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const PRICE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "0", label: "Free" },
  { value: "500", label: "$5" },
  { value: "1000", label: "$10" },
  { value: "2000", label: "$20" },
  { value: "5000", label: "$50" },
  { value: "10000", label: "$100+" },
] as const

interface PriceFilterProps {
  minPrice: string
  maxPrice: string
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
}

export function PriceFilter({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: PriceFilterProps) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Label className="sr-only">Price from</Label>
        <Select
          value={minPrice || "any"}
          onValueChange={(v) => onMinPriceChange(v === "any" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="From" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">From</SelectItem>
            {PRICE_OPTIONS.filter((o) => o.value).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label className="sr-only">Price to</Label>
        <Select
          value={maxPrice || "any"}
          onValueChange={(v) => onMaxPriceChange(v === "any" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="To" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">To</SelectItem>
            {PRICE_OPTIONS.filter((o) => o.value).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
