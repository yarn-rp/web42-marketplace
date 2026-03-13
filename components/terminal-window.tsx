"use client"

import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface TerminalWindowProps {
  title?: string
  children: ReactNode
  className?: string
}

export function TerminalWindow({
  title = "terminal",
  children,
  className,
}: TerminalWindowProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-muted-foreground/30" />
          <span className="size-3 rounded-full bg-muted-foreground/30" />
          <span className="size-3 rounded-full bg-muted-foreground/30" />
        </div>
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="p-4 font-mono text-sm">{children}</div>
    </div>
  )
}
