"use client"

import { getActivePlatforms } from "@/lib/platforms"
import { cn } from "@/lib/utils"
import { PlatformLogo } from "@/components/platform-logo"

interface PlatformFilterProps {
  value: string | null
  onChange: (platformId: string | null) => void
}

export function PlatformFilter({ value, onChange }: PlatformFilterProps) {
  const platforms = getActivePlatforms()

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          !value
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        All Platforms
      </button>

      {platforms.map((platform) => (
        <button
          key={platform.id}
          type="button"
          onClick={() => onChange(platform.id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            value === platform.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <PlatformLogo platform={platform} size={18} className="rounded-sm" />
          {platform.name}
        </button>
      ))}
    </div>
  )
}
