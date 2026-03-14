"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/cult/fade-in"
import { TerminalWindow } from "@/components/terminal-window"
import { CliInstallBlock } from "@/components/landing/cli-install-block"
import { PixelTerminal } from "@/components/pixel-art"

const publishLines = [
  { prefix: "#", text: "publish your existing agent" },
  { prefix: "$", text: "web42 init" },
  { prefix: "$", text: "web42 pack" },
  { prefix: "$", text: "web42 push" },
]

export function CreatorCTA() {
  const reducedMotion = useReducedMotion()

  const lineVariants = reducedMotion
    ? { hidden: { opacity: 1, x: 0 }, visible: { opacity: 1, x: 0 } }
    : { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      {/* Step 1: Install the CLI */}
      <FadeIn className="mb-14">
        <div className="flex flex-col items-center text-center">
          <h2 className="mb-2 font-mono text-xl font-bold md:text-2xl">
            <span className="text-muted-foreground">$</span> step one: install the cli
          </h2>
          <p className="mb-5 max-w-md text-sm text-muted-foreground">
            The CLI is required to use Web42. Without it, you can&apos;t install
            or publish agents. One command and you&apos;re in.
          </p>
          <CliInstallBlock className="w-full max-w-2xl" />
        </div>
      </FadeIn>

      {/* Step 2: Publish and earn */}
      <FadeIn>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-3">
              {!reducedMotion ? (
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-muted-foreground/30"
                >
                  <PixelTerminal className="size-10" />
                </motion.div>
              ) : (
                <div className="text-muted-foreground/30">
                  <PixelTerminal className="size-10" />
                </div>
              )}
              <h2 className="font-mono text-2xl font-bold md:text-3xl">
                {"> ready to publish?"}
                <span className="animate-blink">_</span>
              </h2>
            </div>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Already built a great agent? Publish it to the marketplace and
              earn from your expertise. Or share it for free to help the
              community. Three commands is all it takes.
            </p>
            <Button variant="outline" asChild className="font-mono">
              <Link href="/cli">
                learn more
              </Link>
            </Button>
          </div>

          <TerminalWindow title="~/my-agent">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "0px 0px -100px" }}
              transition={{
                staggerChildren: reducedMotion ? 0 : 0.15,
                delayChildren: reducedMotion ? 0 : 0.2,
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
                  <span className={line.prefix === "#" ? "text-zinc-600" : "text-zinc-300"}>
                    {line.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </TerminalWindow>
        </div>
      </FadeIn>
    </section>
  )
}
