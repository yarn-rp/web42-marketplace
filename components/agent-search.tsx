"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { InputButton } from "@/components/ui/input"

import { IconSpinner } from "./ui/icons"

export function AgentSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get("search") ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
  }

  return (
    <div className="relative w-full max-w-[42ch]">
      <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 font-mono text-sm text-muted-foreground">
        &gt;
      </span>
      <InputButton
        id="search"
        className={cn(
          "relative w-full py-2.5 pl-8 pr-9 text-sm font-mono shadow-sm",
          "placeholder:text-muted-foreground"
        )}
        tabIndex={0}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="search agents..."
        spellCheck={false}
        enterKeyHint="go"
      >
        <div className="relative -ml-10 hidden items-center justify-center md:flex">
          <div className="absolute ml-4 w-14 rounded-r-full">
            <AnimatePresence>
              {isPending ? (
                <IconSpinner className="-ml-0.5 h-7 w-7 animate-spin stroke-foreground/60" />
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </InputButton>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
