"use client"

import { useState, useEffect } from "react"
import { Check, Copy, Download } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { getInstallCommand, getPlatform } from "@/lib/platforms"
import { PlatformLogo } from "@/components/platform-logo"
import { CliInstallBlock } from "@/components/landing/cli-install-block"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const CLI_INSTALLED_KEY = "web42-cli-installed"

interface InstallButtonProps {
  username: string
  agentSlug: string
  platform?: string
}

type Step = "cli-check" | "agent-install"

export function InstallButton({ username, agentSlug, platform }: InstallButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<Step>("cli-check")
  const command = getInstallCommand(platform, username, agentSlug)
  const platformInfo = getPlatform(platform)

  useEffect(() => {
    try {
      if (localStorage.getItem(CLI_INSTALLED_KEY) === "true") {
        setStep("agent-install")
      }
    } catch {
      // localStorage may be unavailable (SSR, private browsing)
    }
  }, [])

  const handleConfirmCliInstalled = () => {
    try {
      localStorage.setItem(CLI_INSTALLED_KEY, "true")
    } catch {}
    setStep("agent-install")
  }

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
      <PopoverContent
        align="end"
        className={cn(step === "cli-check" ? "w-96" : "w-80")}
      >
        {step === "cli-check" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {platformInfo && (
                <PlatformLogo platform={platformInfo} size={18} className="rounded-sm" />
              )}
              <p className="text-sm font-medium">
                Install{platformInfo ? ` for ${platformInfo.name}` : ""}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              The Web42 CLI is required to install agents.
            </p>
            <CliInstallBlock title="install cli" />
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/docs/cli"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Learn more
              </Link>
              <Button size="sm" onClick={handleConfirmCliInstalled}>
                I already installed it
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {platformInfo && (
                <PlatformLogo platform={platformInfo} size={18} className="rounded-sm" />
              )}
              <p className="text-sm font-medium">
                Install{platformInfo ? ` for ${platformInfo.name}` : ""}
              </p>
            </div>
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
        )}
      </PopoverContent>
    </Popover>
  )
}
