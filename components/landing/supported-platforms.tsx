"use client"

import { getActivePlatforms, getComingSoonPlatforms } from "@/lib/platforms"
import { FadeIn } from "@/components/cult/fade-in"
import { PlatformLogo } from "@/components/platform-logo"

export function SupportedPlatforms() {
  const active = getActivePlatforms()
  const comingSoon = getComingSoonPlatforms()

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <FadeIn className="flex flex-col items-center text-center">
        <p className="mb-6 font-pixel text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          available for these platforms
        </p>

        <div className="flex items-center gap-8">
          {active.map((platform) => (
            <a
              key={platform.id}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
            >
              <PlatformLogo platform={platform} />
              <span className="font-mono text-xs text-foreground">
                {platform.name}
              </span>
            </a>
          ))}

          {comingSoon.map((platform) => (
            <a
              key={platform.id}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
            >
              <PlatformLogo platform={platform} className="grayscale" />
              <span className="font-mono text-xs text-muted-foreground">
                {platform.name}
              </span>
              <span className="font-pixel text-[8px] uppercase tracking-wider text-muted-foreground">
                coming soon
              </span>
            </a>
          ))}
        </div>

        <p className="mt-6 max-w-sm text-xs text-muted-foreground">
          Agents are platform-native. Each platform has its own agent
          ecosystem within Web42.
        </p>
      </FadeIn>
    </section>
  )
}
