"use client"

import { motion, useReducedMotion } from "framer-motion"

import { PixelRobot, PixelTerminal } from "@/components/pixel-art"
import { TerminalWindow } from "@/components/terminal-window"
import { TerminalLine } from "@/components/terminal-line"
import { TypingAnimation } from "@/components/typing-animation"

const terminalLines = [
  { prefix: "$", text: 'web42 search "code-review"' },
  { prefix: ">", text: "found 12 agents matching your query" },
  { prefix: "$", text: "web42 install @expert/code-reviewer" },
  { prefix: ">", text: "agent installed successfully" },
]

export function LoginHero() {
  const reducedMotion = useReducedMotion()

  const lineVariants = reducedMotion
    ? { hidden: { opacity: 1, x: 0 }, visible: { opacity: 1, x: 0 } }
    : { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }

  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-card p-10 lg:flex">
      <div className="dot-grid pointer-events-none absolute inset-0 z-0" />

      <div className="relative z-10 flex flex-col gap-10">
        {!reducedMotion && (
          <motion.div
            className="absolute -right-2 -top-2 text-muted-foreground/20"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <PixelRobot className="size-14" />
          </motion.div>
        )}

        <div className="flex items-center gap-3">
          {!reducedMotion ? (
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-muted-foreground/30"
            >
              <PixelTerminal className="size-8" />
            </motion.div>
          ) : (
            <div className="text-muted-foreground/30">
              <PixelTerminal className="size-8" />
            </div>
          )}
          <span className="font-pixel text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            the ai agent marketplace
          </span>
        </div>

        <TypingAnimation
          text="> expert agents, one command away"
          className="max-w-sm text-xl font-bold tracking-tight md:text-2xl"
          speed={45}
          delay={300}
        />

        <TerminalWindow title="~/agents" className="max-w-md">
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{
              staggerChildren: reducedMotion ? 0 : 0.4,
              delayChildren: reducedMotion ? 0 : 2,
            }}
            className="space-y-2"
          >
            {terminalLines.map((line, i) => (
              <motion.div
                key={i}
                variants={lineVariants}
                transition={{ duration: reducedMotion ? 0 : 0.4 }}
              >
                <TerminalLine prefix={line.prefix}>{line.text}</TerminalLine>
              </motion.div>
            ))}
          </motion.div>
        </TerminalWindow>
      </div>

      <p className="relative z-10 max-w-xs text-xs text-muted-foreground">
        Platform-native agents built by experts, ready to install with a single
        command.
      </p>
    </div>
  )
}
