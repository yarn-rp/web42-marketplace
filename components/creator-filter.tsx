"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { searchCreators, type CreatorSearchResult } from "@/app/actions/filters"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function CreatorFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [creators, setCreators] = useState<CreatorSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const activeCreator = searchParams.get("creator")

  const fetchCreators = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setCreators([])
      return
    }
    setLoading(true)
    try {
      const results = await searchCreators(q)
      setCreators(results)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchCreators(query), 300)
    return () => clearTimeout(t)
  }, [query, fetchCreators])

  const handleSelect = (username: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    params.set("creator", username)
    router.replace(`${pathname}?${params.toString()}`)
    setOpen(false)
    setQuery("")
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    params.delete("creator")
    router.replace(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  const displayValue = activeCreator
    ? creators.find((c) => c.username === activeCreator)?.full_name ||
      creators.find((c) => c.username === activeCreator)?.username ||
      activeCreator
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {displayValue ? (
            <span className="flex items-center gap-2 truncate">
              {displayValue}
              <button
                type="button"
                className="rounded p-0.5 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClear()
                }}
                aria-label="Clear creator"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ) : (
            <span className="text-muted-foreground">Search creators...</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search creators..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Searching..." : query.length < 2 ? "Type to search..." : "No creators found."}
            </CommandEmpty>
            <CommandGroup>
              {creators.map((creator) => (
                <CommandItem
                  key={creator.id}
                  value={creator.username ?? creator.id}
                  onSelect={() => creator.username && handleSelect(creator.username)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      activeCreator === creator.username ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {creator.full_name || creator.username || "Unknown"}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
