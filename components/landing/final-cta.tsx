"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/cult/fade-in"
import { PixelBrackets } from "@/components/pixel-art"

export function FinalCTA() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <FadeIn className="flex flex-col items-center">
        <PixelBrackets className="mb-6 size-8 text-muted-foreground/20" />
        <h2 className="mb-6 font-mono text-2xl font-bold md:text-3xl">
          expert agents, one command away
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="font-mono">
            <Link href="/explore">explore agents</Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="font-mono">
            <Link href="/cli">get the cli</Link>
          </Button>
        </div>
      </FadeIn>
    </section>
  )
}
