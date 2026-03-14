"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Copy, ArrowRight } from "lucide-react"
import Link from "next/link"

import { getInstallCommand } from "@/lib/platforms"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { TerminalWindow } from "@/components/terminal-window"

interface CheckoutSuccessProps {
  agentName: string
  agentSlug: string
  username: string
  platform?: string
  currentUsername?: string
}

const TYPING_SPEED = 30
const LINE_PAUSE = 400

function useTypingSequence(lines: string[], active: boolean) {
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active || done) return
    if (currentLine >= lines.length) {
      setDone(true)
      return
    }

    const line = lines[currentLine]
    if (currentChar >= line.length) {
      const timer = setTimeout(() => {
        setCurrentLine((l) => l + 1)
        setCurrentChar(0)
      }, LINE_PAUSE)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(
      () => setCurrentChar((c) => c + 1),
      TYPING_SPEED
    )
    return () => clearTimeout(timer)
  }, [active, currentLine, currentChar, lines, done])

  const visibleLines = lines.slice(0, currentLine + 1).map((line, i) => {
    if (i < currentLine) return line
    return line.slice(0, currentChar)
  })

  return { visibleLines, done, currentLine }
}

export function CheckoutSuccess({
  agentName,
  agentSlug,
  username,
  platform,
  currentUsername,
}: CheckoutSuccessProps) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  const installCommand = getInstallCommand(platform, username, agentSlug)

  const terminalLines = [
    `$ web42 checkout --agent @${username}/${agentSlug}`,
    "> verifying payment... done",
    "> registering license... done",
    "> agent unlocked!",
    "",
    `✓ ${agentName} is now yours.`,
  ]

  const { visibleLines, done } = useTypingSequence(terminalLines, open)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [installCommand])

  const handleClose = useCallback(() => {
    setOpen(false)
    const url = new URL(window.location.href)
    url.searchParams.delete("checkout")
    url.searchParams.delete("session_id")
    router.replace(url.pathname, { scroll: false })
  }, [router])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden border-border bg-background p-0 sm:rounded-xl">
        <DialogTitle className="sr-only">
          Purchase complete
        </DialogTitle>

        <div className="p-6">
          <TerminalWindow title="web42">
            <div className="min-h-[180px] space-y-1 text-sm leading-relaxed">
              {visibleLines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "font-mono",
                    i === 0 && "text-zinc-500",
                    line.startsWith(">") && "text-emerald-400",
                    line.startsWith("✓") && "font-semibold text-emerald-400",
                    !line.startsWith(">") && !line.startsWith("✓") && i !== 0 && "text-zinc-300"
                  )}
                >
                  {line || "\u00A0"}
                  {i === visibleLines.length - 1 && !done && (
                    <span className="animate-pulse">▌</span>
                  )}
                </div>
              ))}
            </div>
          </TerminalWindow>
        </div>

        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-4 border-t border-border bg-muted/30 px-6 py-5"
            >
              <div>
                <p className="mb-2 text-sm font-medium">Install on your setup</p>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 font-mono text-sm">
                  <code className="flex-1 truncate text-muted-foreground">
                    {installCommand}
                  </code>
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
              </div>

              <div className="flex items-center gap-3">
                {currentUsername && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${currentUsername}`}>
                      View in your profile
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                )}
                <Button size="sm" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
