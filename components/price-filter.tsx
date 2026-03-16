"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const priceOptions = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const

export function PriceFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("price") || "all"

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    if (value === "all") {
      params.delete("price")
    } else {
      params.set("price", value)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Price" />
      </SelectTrigger>
      <SelectContent>
        {priceOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
