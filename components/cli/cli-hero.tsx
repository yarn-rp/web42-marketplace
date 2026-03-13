"use client"

import { motion, useReducedMotion } from "framer-motion"

import { TypingAnimation } from "@/components/typing-animation"
import { CliInstallBlock } from "@/components/landing/cli-install-block"
import { PixelTerminal } from "@/components/pixel-art"

export function CliHero() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pt-24 pb-20 text-center sm:px-6">
      {!reducedMotion && (
        <motion.div
          className="absolute left-[8%] top-20 hidden text-muted-foreground/15 lg:block"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <PixelTerminal className="size-14" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-3 font-pixel text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
      >
        required to start
      </motion.div>

      <TypingAnimation
        text="> no cli, no agents."
        className="mb-4 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl"
        speed={45}
        delay={200}
      />

      <motion.p
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reducedMotion ? 0 : 1.5, duration: 0.6 }}
        className="mb-10 max-w-lg text-sm text-muted-foreground md:text-base"
      >
        The CLI is your key to the Web42 marketplace. Install it first, then
        browse and install expert-built agents or publish your own. Nothing works
        without it.
      </motion.p>

      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : 2.3, duration: 0.5 }}
        className="w-full max-w-md"
      >
        <CliInstallBlock />
      </motion.div>
    </section>
  )
}
