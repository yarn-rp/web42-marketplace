"use client"

import { useState, useEffect } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TerminalWindow } from "@/components/terminal-window"

type TokenType = "cmd" | "flag" | "url" | "pkg" | "pipe" | "plain"

interface Token {
  text: string
  type: TokenType
}

const TOKEN_COLORS: Record<TokenType, string> = {
  cmd: "text-green-400",
  flag: "text-yellow-400",
  url: "text-cyan-400/80",
  pkg: "text-purple-400",
  pipe: "text-zinc-500",
  plain: "text-zinc-300",
}

interface InstallMethod {
  id: string
  label: string
  command: string
  tokens: Token[]
}

const INSTALL_METHODS: InstallMethod[] = [
  {
    id: "brew",
    label: "Homebrew",
    command: "brew install yarn-rp/web42/web42",
    tokens: [
      { text: "brew", type: "cmd" },
      { text: " install ", type: "plain" },
      { text: "yarn-rp/web42/web42", type: "pkg" },
    ],
  },
  {
    id: "shell",
    label: "Shell",
    command:
      "curl -fsSL https://raw.githubusercontent.com/yarn-rp/web42-marketplace/main/packages/cli/install.sh | bash",
    tokens: [
      { text: "curl", type: "cmd" },
      { text: " -fsSL ", type: "flag" },
      {
        text: "https://raw.githubusercontent.com/yarn-rp/web42-marketplace/main/packages/cli/install.sh",
        type: "url",
      },
      { text: " | ", type: "pipe" },
      { text: "bash", type: "cmd" },
    ],
  },
  {
    id: "npm",
    label: "npm",
    command: "npm install -g @web42/cli",
    tokens: [
      { text: "npm", type: "cmd" },
      { text: " install ", type: "plain" },
      { text: "-g", type: "flag" },
      { text: " ", type: "plain" },
      { text: "@web42/cli", type: "pkg" },
    ],
  },
  {
    id: "scoop",
    label: "Scoop",
    command:
      "scoop bucket add web42 https://github.com/yarn-rp/scoop-web42 && scoop install web42",
    tokens: [
      { text: "scoop", type: "cmd" },
      { text: " bucket add ", type: "plain" },
      { text: "web42", type: "pkg" },
      { text: " ", type: "plain" },
      { text: "https://github.com/yarn-rp/scoop-web42", type: "url" },
      { text: " && ", type: "pipe" },
      { text: "scoop", type: "cmd" },
      { text: " install ", type: "plain" },
      { text: "web42", type: "pkg" },
    ],
  },
]

function detectDefaultTab(): string {
  if (typeof navigator === "undefined") return "brew"
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes("win")) return "scoop"
  if (ua.includes("linux")) return "shell"
  return "brew"
}

function HighlightedCommand({ tokens }: { tokens: Token[] }) {
  return (
    <span className="break-all">
      {tokens.map((t, i) => (
        <span key={i} className={TOKEN_COLORS[t.type]}>
          {t.text}
        </span>
      ))}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
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
        "shrink-0 rounded p-1.5 transition-colors hover:bg-white/10",
        copied && "text-zinc-200"
      )}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="size-3.5 text-green-400" />
      ) : (
        <Copy className="size-3.5 text-zinc-500" />
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
  const [defaultTab, setDefaultTab] = useState("brew")

  useEffect(() => {
    setDefaultTab(detectDefaultTab())
  }, [])

  if (compact) {
    const primary = INSTALL_METHODS[0]
    return (
      <TerminalWindow title={title} className={className}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 gap-2">
            <span className="select-none text-zinc-500">$</span>
            <HighlightedCommand tokens={primary.tokens} />
          </div>
          <CopyButton text={primary.command} />
        </div>
      </TerminalWindow>
    )
  }

  return (
    <TerminalWindow title={title} className={className}>
      <Tabs defaultValue={defaultTab} key={defaultTab}>
        <TabsList className="mb-3 h-8 w-full rounded-md border border-white/5 bg-white/5 p-0.5">
          {INSTALL_METHODS.map((m) => (
            <TabsTrigger
              key={m.id}
              value={m.id}
              className="flex-1 rounded px-2 py-1 text-xs text-zinc-500 transition-colors data-[state=active]:bg-white/10 data-[state=active]:text-zinc-200 data-[state=active]:shadow-none"
            >
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {INSTALL_METHODS.map((m) => (
          <TabsContent key={m.id} value={m.id} className="mt-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-2">
                <span className="select-none text-zinc-500">$</span>
                <HighlightedCommand tokens={m.tokens} />
              </div>
              <CopyButton text={m.command} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </TerminalWindow>
  )
}
