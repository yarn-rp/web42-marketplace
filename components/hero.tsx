import React from "react"
import Link from "next/link"
import { Github, Terminal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center md:items-start md:px-2 justify-center gap-2 md:ml-12">
      <div className="flex items-center space-x-2">
        <h1 className="text-5xl font-black text-left">web42</h1>
        <Badge
          variant="outline"
          className="border border-primary/10 hidden md:block"
        >
          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse mr-1"></span>
          Agent Marketplace
        </Badge>
      </div>
      <div className="flex flex-col items-center md:items-start md:mt-4">
        <div className="flex w-full items-center mt-2 justify-center md:justify-start">
          <Terminal className="hidden md:block size-4" />
          <span className="mx-2 text-xl font-bold text-left">
            OpenClaw Agent Packages
          </span>
        </div>
        <p className="mt-2 text-center md:text-left text-muted-foreground text-sm md:text-base px-2">
          Share your exact OpenClaw setup so others can have exactly what you
          have.
        </p>
      </div>
      <div className="flex mt-4 mb-4 space-x-4">
        <Button variant="secondary" asChild>
          <Link href="/explore" className="flex items-center">
            Explore Agents
          </Link>
        </Button>
        <a
          href="https://github.com/web42-ai"
          target="_blank"
          rel="noreferrer"
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="size-4 mr-1" />
          GitHub
        </a>
      </div>
      {children}
    </div>
  )
}
