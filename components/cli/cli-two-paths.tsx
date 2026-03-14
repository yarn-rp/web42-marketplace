"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/cult/fade-in"
import { TerminalWindow } from "@/components/terminal-window"

const installLines = [
  { prefix: "$", text: "web42 install @creator/agent-name" },
  { prefix: "$", text: "web42 list" },
  { prefix: "$", text: "web42 update" },
]

const publishLines = [
  { prefix: "$", text: "web42 init" },
  { prefix: "$", text: "web42 pack" },
  { prefix: "$", text: "web42 push" },
]

export function CliTwoPaths() {
  const reducedMotion = useReducedMotion()

  const lineVariants = reducedMotion
    ? { hidden: { opacity: 1, x: 0 }, visible: { opacity: 1, x: 0 } }
    : { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <FadeIn className="mb-10 text-center">
        <h2 className="font-mono text-xl font-bold md:text-2xl">
          two paths, one tool
        </h2>
      </FadeIn>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Install path */}
        <FadeIn>
          <div className="space-y-5">
            <h3 className="font-mono text-lg font-semibold">
              <span className="text-muted-foreground">$</span> install agents
            </h3>

            <TerminalWindow title="terminal">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "0px 0px -100px" }}
                transition={{
                  staggerChildren: reducedMotion ? 0 : 0.12,
                  delayChildren: reducedMotion ? 0 : 0.15,
                }}
                className="space-y-2"
              >
                {installLines.map((line, i) => (
                  <motion.div
                    key={i}
                    variants={lineVariants}
                    transition={{ duration: reducedMotion ? 0 : 0.4 }}
                    className="flex gap-2"
                  >
                    <span className="select-none text-zinc-500">
                      {line.prefix}
                    </span>
                    <span className="text-zinc-300">{line.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </TerminalWindow>

            <p className="text-sm text-muted-foreground">
              Install expert-built agents in seconds. No setup, no config
              &mdash; just one command and you&apos;re running.
            </p>

            <Button variant="outline" asChild className="font-mono">
              <Link href="/explore">browse agents</Link>
            </Button>
          </div>
        </FadeIn>

        {/* Publish path */}
        <FadeIn>
          <div className="space-y-5">
            <h3 className="font-mono text-lg font-semibold">
              <span className="text-muted-foreground">$</span> publish and earn
            </h3>

            <TerminalWindow title="~/my-agent">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "0px 0px -100px" }}
                transition={{
                  staggerChildren: reducedMotion ? 0 : 0.12,
                  delayChildren: reducedMotion ? 0 : 0.15,
                }}
                className="space-y-2"
              >
                {publishLines.map((line, i) => (
                  <motion.div
                    key={i}
                    variants={lineVariants}
                    transition={{ duration: reducedMotion ? 0 : 0.4 }}
                    className="flex gap-2"
                  >
                    <span className="select-none text-zinc-500">
                      {line.prefix}
                    </span>
                    <span className="text-zinc-300">{line.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </TerminalWindow>

            <p className="text-sm text-muted-foreground">
              Already built a great agent? Publish it and earn from your
              expertise. Or share it for free to help the community.
            </p>

            <Button variant="outline" asChild className="font-mono">
              <Link href="/docs/publishing">publishing guide</Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
