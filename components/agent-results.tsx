import { Terminal } from "lucide-react"

import { getAgents, type SortOption } from "@/app/actions/agent"
import { AgentCard } from "@/components/agent-card"

interface AgentResultsProps {
  search?: string
  category?: string
  tag?: string
  sort?: SortOption
  platform?: string
}

export async function AgentResults({
  search,
  category,
  tag,
  sort,
  platform,
}: AgentResultsProps) {
  const agents = await getAgents(search, category, tag, sort, platform)
  const hasFilter = search || category || tag || platform

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed p-12 text-center">
        <Terminal className="size-10 mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-medium mb-2">
          {hasFilter ? "No agents match your filters" : "No agents yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {hasFilter
            ? "Try a different search term or category."
            : "Be the first to publish an agent package."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.map((agent, i) => (
        <AgentCard key={agent.id} agent={agent} order={i} showPrice />
      ))}
    </div>
  )
}
