"use client"

import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface TerminalLineProps {
  prefix: string
  children: string
  className?: string
}

function highlightCommand(text: string): ReactNode {
  const parts: ReactNode[] = []
  let remaining = text

  while (remaining.length > 0) {
    const idx = remaining.indexOf("web42")
    if (idx === -1) {
      parts.push(remaining)
      break
    }
    if (idx > 0) parts.push(remaining.slice(0, idx))
    parts.push(
      <span key={parts.length} className="text-green-600 dark:text-terminal-green">
        web42
      </span>
    )
    remaining = remaining.slice(idx + 5)
  }

  return parts
}

export function TerminalLine({ prefix, children, className }: TerminalLineProps) {
  const isComment = prefix === "#"
  const isOutput = prefix === ">"

  return (
    <div className={cn("flex gap-2", className)}>
      <span
        className={cn(
          "select-none",
          isOutput
            ? "text-green-600 dark:text-terminal-green"
            : "text-zinc-400 dark:text-terminal-muted"
        )}
      >
        {prefix}
      </span>
      <span
        className={cn(
          isComment && "text-zinc-400 dark:text-terminal-muted",
          isOutput && "text-zinc-500 dark:text-terminal-muted",
          !isComment && !isOutput && "text-zinc-800 dark:text-terminal-foreground"
        )}
      >
        {!isComment && !isOutput ? highlightCommand(children) : children}
      </span>
    </div>
  )
}
