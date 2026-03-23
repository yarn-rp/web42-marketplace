"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { Agent } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/cult/fade-in"
import { FeaturedCarousel } from "@/components/featured-carousel"

interface FeaturedSectionProps {
  featured: Agent[]
}

export function FeaturedSection({ featured }: FeaturedSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      {featured.length > 0 && (
        <FadeIn>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-mono text-lg font-semibold">
              <span className="text-muted-foreground">$</span> featured
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/explore" className="font-mono text-xs">
                browse all
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
          <FeaturedCarousel agents={featured} />
        </FadeIn>
      )}
    </section>
  )
}
