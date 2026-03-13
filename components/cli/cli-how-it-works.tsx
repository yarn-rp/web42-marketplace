"use client"

import { FadeIn, FadeInStagger } from "@/components/cult/fade-in"
import {
  PixelTerminal,
  PixelBox,
  PixelRobot,
  PixelScaffold,
  PixelUpload,
} from "@/components/pixel-art"

const installSteps = [
  {
    icon: PixelTerminal,
    command: "web42 search",
    description: "Browse the marketplace and find agents built by experts for your platform.",
  },
  {
    icon: PixelBox,
    command: "web42 install @creator/agent",
    description: "Install any agent in seconds. No setup, no config.",
  },
  {
    icon: PixelRobot,
    command: "done",
    description: "The agent is ready to use. Start working with expert-built tools immediately.",
  },
]

const publishSteps = [
  {
    icon: PixelScaffold,
    command: "web42 init",
    description: "Scaffolds your existing agent into a Web42 package with config, prompts, and tools.",
  },
  {
    icon: PixelBox,
    command: "web42 pack",
    description: "Bundles everything into a distributable package.",
  },
  {
    icon: PixelUpload,
    command: "web42 push",
    description: "Publishes to the marketplace. Set a price or share for free.",
  },
]

function StepGrid({ steps }: { steps: typeof installSteps }) {
  return (
    <FadeInStagger className="grid gap-8 md:grid-cols-3">
      {steps.map((step) => (
        <FadeIn key={step.command}>
          <div className="flex flex-col items-center text-center">
            <step.icon className="mb-4 size-10 text-muted-foreground/40" />
            <code className="mb-2 font-mono text-sm font-semibold">
              {step.command}
            </code>
            <p className="max-w-[240px] text-xs text-muted-foreground">
              {step.description}
            </p>
          </div>
        </FadeIn>
      ))}
    </FadeInStagger>
  )
}

export function CliHowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 space-y-20">
      <div>
        <FadeIn className="mb-10 text-center">
          <h2 className="font-mono text-xl font-bold md:text-2xl">
            installing agents
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Find and install expert-built agents in seconds.
          </p>
        </FadeIn>
        <StepGrid steps={installSteps} />
      </div>

      <div>
        <FadeIn className="mb-10 text-center">
          <h2 className="font-mono text-xl font-bold md:text-2xl">
            publishing agents
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already built a great agent? Three commands to the marketplace.
          </p>
        </FadeIn>
        <StepGrid steps={publishSteps} />
      </div>
    </section>
  )
}
