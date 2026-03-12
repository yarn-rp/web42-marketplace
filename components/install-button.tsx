"use client"

import { useState } from "react"
import { Check, Copy, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface InstallButtonProps {
  username: string
  agentSlug: string
}

export function InstallButton({ username, agentSlug }: InstallButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const command = `web42 install @${username}/${agentSlug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Download className="size-4" />
          Install
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="space-y-3">
          <p className="text-sm font-medium">Install</p>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
            <code className="flex-1 truncate">{command}</code>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Copy and run in your terminal to install this agent.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
