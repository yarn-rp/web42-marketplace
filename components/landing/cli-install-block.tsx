"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { TerminalWindow } from "@/components/terminal-window"

interface CliInstallBlockProps {
  command?: string
  title?: string
  className?: string
}

export function CliInstallBlock({
  command = "npm install -g web42",
  title = "terminal",
  className,
}: CliInstallBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TerminalWindow title={title} className={className}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <span className="select-none text-muted-foreground">$</span>
          <span>{command}</span>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "shrink-0 rounded p-1.5 transition-colors hover:bg-accent",
            copied && "text-foreground"
          )}
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </TerminalWindow>
  )
}
