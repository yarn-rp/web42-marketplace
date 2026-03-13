"use client"

import { motion, useReducedMotion } from "framer-motion"

import { AgentSearch } from "@/components/agent-search"
import { TypingAnimation } from "@/components/typing-animation"
import { PixelRobot } from "@/components/pixel-art"

export function HeroSection() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pt-24 pb-20 text-center sm:px-6">
      {!reducedMotion && (
        <motion.div
          className="absolute right-[10%] top-16 hidden text-muted-foreground/20 lg:block"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <PixelRobot className="size-16" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-3 font-pixel text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
      >
        the ai agent marketplace
      </motion.div>

      <TypingAnimation
        text="> install expert-built agents in seconds"
        className="mb-4 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl"
        speed={50}
        delay={200}
      />

      <motion.p
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reducedMotion ? 0 : 2, duration: 0.6 }}
        className="mb-10 max-w-lg text-sm text-muted-foreground md:text-base"
      >
        Web42 is the marketplace where experts publish their AI agents and you
        install them with one command. Platform-native agents, built by experts,
        ready to use.
      </motion.p>

      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : 1.8, duration: 0.5 }}
        className="w-full max-w-md"
      >
        <AgentSearch />
      </motion.div>
    </section>
  )
}
