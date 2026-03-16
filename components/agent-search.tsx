"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export function AgentSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get("search") ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isExplorePage = pathname === "/explore"

  const navigateToExplore = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (term) {
        params.set("search", term)
      } else {
        params.delete("search")
      }
      startTransition(() => {
        if (isExplorePage) {
          router.replace(`/explore?${params.toString()}`)
        } else {
          router.push(`/explore?${params.toString()}`)
        }
      })
    },
    [router, searchParams, isExplorePage, startTransition]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setValue(term)

    if (!isExplorePage) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigateToExplore(term)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      navigateToExplore(value)
    }
  }

  const handleClear = () => {
    setValue("")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    navigateToExplore("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full max-w-[42ch]">
      <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 font-mono text-sm text-muted-foreground">
        &gt;
      </span>

      <Input
        ref={inputRef}
        type="text"
        id="search"
        className={cn(
          "h-12 w-full rounded-full pl-9 pr-10 font-mono text-sm",
          "border border-border/50 bg-background",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
          "transition-shadow duration-200",
          "focus-visible:ring-1 focus-visible:ring-yellow-500/30 focus-visible:ring-offset-0",
          "focus-visible:border-yellow-500/20",
          "placeholder:text-muted-foreground/60"
        )}
        tabIndex={0}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="search agents..."
        spellCheck={false}
        enterKeyHint="go"
        autoComplete="off"
      />

      <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
        {isPending && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
        {value && !isPending && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
