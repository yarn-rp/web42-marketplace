"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { getActivePlatforms } from "@/lib/platforms"
import { cn } from "@/lib/utils"
import { PlatformLogo } from "@/components/platform-logo"

export function PlatformFilter() {
  const searchParams = useSearchParams()
  const activePlatform = searchParams.get("platform")

  const platforms = getActivePlatforms()

  function buildHref(platformId?: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (platformId) {
      params.set("platform", platformId)
    } else {
      params.delete("platform")
    }
    params.delete("category")
    params.delete("tag")
    return `/explore?${params.toString()}`
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={buildHref()}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          !activePlatform
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        All Platforms
      </Link>

      {platforms.map((platform) => (
        <Link
          key={platform.id}
          href={buildHref(platform.id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            activePlatform === platform.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <PlatformLogo platform={platform} size={18} className="rounded-sm" />
          {platform.name}
        </Link>
      ))}
    </div>
  )
}
