"use client"

import { useCallback, useEffect, useState } from "react"
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

interface CreatorFilterProps {
  value: string | null
  onChange: (username: string | null) => void
}

export function CreatorFilter({ value, onChange }: CreatorFilterProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [creators, setCreators] = useState<CreatorSearchResult[]>([])

  const fetchCreators = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setCreators([])
      return
    }
    try {
      const results = await searchCreators(q)
      setCreators(results)
    } catch {
      setCreators([])
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchCreators(query), 300)
    return () => clearTimeout(t)
  }, [query, fetchCreators])

  const handleSelect = (username: string) => {
    onChange(username)
    setOpen(false)
    setQuery("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
    setOpen(false)
  }

  const displayValue = value || null

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
                onClick={handleClear}
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
              {query.length < 2 ? "Type to search..." : "No creators found."}
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
                      value === creator.username ? "opacity-100" : "opacity-0"
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
