"use client"

import { useState } from "react"
import { motion } from "framer-motion"

import type { Agent, AgentVisibility } from "@/lib/types"
import { AgentCard } from "@/components/agent-card"
import { AgentVisibilityToggle } from "@/components/agent-visibility-toggle"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProfileAgentGridProps {
  agents: Agent[]
  isOwner: boolean
  profileUsername: string
}

function filterByVisibility(
  agents: Agent[],
  filter: "all" | "public" | "private"
): Agent[] {
  if (filter === "all") return agents
  return agents.filter((a) => a.visibility === filter)
}

export function ProfileAgentGrid({
  agents,
  isOwner,
  profileUsername,
}: ProfileAgentGridProps) {
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "public" | "private"
  >("all")
  const filteredAgents = filterByVisibility(agents, visibilityFilter)

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            {isOwner
              ? "No agents yet. Use web42 push to publish your first agent."
              : "No agents published yet."}
          </p>
          {isOwner && (
            <code className="font-mono rounded bg-muted px-1.5 py-0.5 text-xs">
              web42 push
            </code>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <Tabs
          value={visibilityFilter}
          onValueChange={(v) =>
            setVisibilityFilter(v as "all" | "public" | "private")
          }
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAgents.map((agent, index) => (
          <motion.div
            key={agent.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <AgentCard agent={agent} order={index} showPrice />
            {isOwner && (
              <div
                className="absolute left-3 top-3 z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <AgentVisibilityToggle
                  agentId={agent.id}
                  currentVisibility={(agent.visibility ?? "public") as AgentVisibility}
                  profileUsername={profileUsername}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
