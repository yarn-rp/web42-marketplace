"use client"

import { useState } from "react"
import { Check, Copy, Terminal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface InstallSnippetProps {
  username: string
  agentSlug: string
}

export function InstallSnippet({ username, agentSlug }: InstallSnippetProps) {
  const [copied, setCopied] = useState(false)
  const command = `web42 install @${username}/${agentSlug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 font-mono text-sm"
      )}
    >
      <Terminal className="size-4 shrink-0 text-muted-foreground" />
      <code className="flex-1 truncate">{command}</code>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  )
}
