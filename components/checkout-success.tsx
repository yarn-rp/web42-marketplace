"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Copy } from "lucide-react"
import Link from "next/link"

import { getInstallCommand } from "@/lib/platforms"
import { cn } from "@/lib/utils"

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

  return { visibleLines, done }
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Terminal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 mx-4 w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 shadow-2xl dark:border-[#2a2b3d]"
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-4 py-3 dark:border-[#2a2b3d] dark:bg-[#16161e]">
          <div className="flex gap-1.5">
            <button
              onClick={handleClose}
              className="group size-3 rounded-full bg-[#ff5f57] transition-transform hover:scale-110"
              aria-label="Close"
            >
              <span className="flex size-full items-center justify-center text-[8px] font-bold text-transparent group-hover:text-[#4a0002]">
                ✕
              </span>
            </button>
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 font-mono text-xs text-zinc-400 dark:text-zinc-500">
            web42
          </span>
        </div>

        {/* Terminal body */}
        <div className="bg-white p-5 font-mono text-sm dark:bg-[#1a1b26]">
          {/* Typing animation */}
          <div className="min-h-[160px] space-y-1 leading-relaxed">
            {visibleLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  i === 0 && "text-zinc-400 dark:text-zinc-500",
                  line.startsWith(">") && "text-emerald-600 dark:text-emerald-400",
                  line.startsWith("✓") && "font-semibold text-emerald-600 dark:text-emerald-400",
                  !line.startsWith(">") && !line.startsWith("✓") && i !== 0 && "text-zinc-700 dark:text-zinc-300"
                )}
              >
                {line || "\u00A0"}
                {i === visibleLines.length - 1 && !done && (
                  <span className="animate-pulse">▌</span>
                )}
              </div>
            ))}
          </div>

          {/* Post-animation content -- all inside the terminal */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="mt-4 space-y-3"
              >
                <div className="h-px bg-zinc-200 dark:bg-[#2a2b3d]" />

                {/* Install command */}
                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    install on your setup:
                  </span>
                  <div className="group flex items-center gap-2">
                    <span className="text-zinc-400 dark:text-zinc-500">$</span>
                    <code className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
                      {installCommand}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-[#2a2b3d] dark:hover:text-zinc-300"
                      aria-label="Copy install command"
                    >
                      {copied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-[#2a2b3d]" />

                {/* Actions as terminal links */}
                <div className="flex items-center gap-4 text-xs">
                  {currentUsername && (
                    <Link
                      href={`/${currentUsername}`}
                      className="text-blue-500 underline decoration-blue-500/30 transition-colors hover:text-blue-400 hover:decoration-blue-400/50 dark:text-blue-400 dark:decoration-blue-400/30"
                    >
                      view in your profile →
                    </Link>
                  )}
                  <button
                    onClick={handleClose}
                    className="text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
