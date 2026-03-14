"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TerminalWindow } from "@/components/terminal-window"

const INSTALL_METHODS = [
  {
    id: "shell",
    label: "Shell",
    command:
      "curl -fsSL https://raw.githubusercontent.com/yarn-rp/web42-marketplace/main/packages/cli/install.sh | bash",
  },
  {
    id: "brew",
    label: "Homebrew",
    command: "brew install yarn-rp/web42/web42",
  },
  {
    id: "npm",
    label: "npm",
    command: "npm install -g @web42/cli",
  },
  {
    id: "scoop",
    label: "Scoop",
    command:
      "scoop bucket add web42 https://github.com/yarn-rp/scoop-web42 && scoop install web42",
  },
] as const

interface CopyButtonProps {
  text: string
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
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
  )
}

interface CliInstallBlockProps {
  compact?: boolean
  title?: string
  className?: string
}

export function CliInstallBlock({
  compact = false,
  title = "terminal",
  className,
}: CliInstallBlockProps) {
  if (compact) {
    const primary = INSTALL_METHODS[0]
    return (
      <TerminalWindow title={title} className={className}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 gap-2">
            <span className="select-none text-muted-foreground">$</span>
            <span className="truncate">{primary.command}</span>
          </div>
          <CopyButton text={primary.command} />
        </div>
      </TerminalWindow>
    )
  }

  return (
    <TerminalWindow title={title} className={className}>
      <Tabs defaultValue="shell">
        <TabsList className="mb-3 h-8 w-full bg-muted/60">
          {INSTALL_METHODS.map((m) => (
            <TabsTrigger
              key={m.id}
              value={m.id}
              className="flex-1 px-2 py-1 text-xs"
            >
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {INSTALL_METHODS.map((m) => (
          <TabsContent key={m.id} value={m.id} className="mt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 gap-2">
                <span className="select-none text-muted-foreground">$</span>
                <span className="break-all">{m.command}</span>
              </div>
              <CopyButton text={m.command} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </TerminalWindow>
  )
}
