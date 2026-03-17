"use client"

import React, { Suspense } from "react"

import type { Agent } from "@/lib/types"
import { cn } from "@/lib/utils"

import { AgentCard } from "./agent-card"

interface AgentGridProps {
  agents: Agent[]
  children?: React.ReactNode
  contained?: boolean
}

export function AgentGrid({ agents, children, contained = true }: AgentGridProps) {
  return (
    <div className="flex flex-col md:items-start gap-4 overflow-hidden pb-4 md:mx-4 mx-0 md:ml-[12rem] lg:ml-[12rem] relative">
      {children && (
        <div
          className={cn(
            "px-4",
            contained
              ? "bg-white p-4 gap-3 dark:bg-terminal-background rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]"
              : "md:p-4 md:gap-3"
          )}
        >
          {children}
        </div>
      )}

      <div
        className={cn(
          "p-4 w-full",
          contained
            ? "bg-white dark:bg-terminal-background rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]"
            : ""
        )}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <div className="relative">
            <AgentMasonryGrid agents={agents} />
          </div>
        </Suspense>
      </div>
    </div>
  )
}

function AgentMasonryGrid({ agents }: { agents: Agent[] }) {
  return (
    <div className="flex justify-center w-full">
      <div className="gap-4 w-full">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
          {agents.map((agent, index) => (
            <div key={`${index}-${agent.id}`}>
              <AgentCard agent={agent} order={index} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FeaturedAgentGrid({ agents }: { agents: Agent[] }) {
  return (
    <div className="mx-auto w-full max-w-7xl bg-neutral-50/40 dark:bg-neutral-950/40 border border-dashed border-black/10 px-4 py-3 sm:px-6 rounded-2xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} order={index} />
        ))}
      </div>
    </div>
  )
}
