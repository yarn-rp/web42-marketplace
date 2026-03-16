"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

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

export function PublishedFromFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("publishedFrom") || ""

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    if (value) {
      params.set("publishedFrom", value)
    } else {
      params.delete("publishedFrom")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Select
      value={current || "any"}
      onValueChange={(v) => handleChange(v === "any" ? "" : v)}
    >
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
