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
        "overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-[#2a2b3d] dark:bg-[#1a1b26]",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-[#2a2b3d] dark:bg-[#16161e]">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="ml-2 font-mono text-xs text-zinc-400 dark:text-zinc-500">
          {title}
        </span>
      </div>
      <div className="p-4 font-mono text-sm text-zinc-800 dark:text-zinc-300">
        {children}
      </div>
    </div>
  )
}
