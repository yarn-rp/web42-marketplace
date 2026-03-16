import { Terminal } from "lucide-react"

import { getAgents, type SortOption } from "@/app/actions/agent"
import { AgentCard } from "@/components/agent-card"
import { ExplorePagination } from "@/components/explore-pagination"

const DEFAULT_PAGE_SIZE = 24

interface AgentResultsProps {
  search?: string
  category?: string
  tag?: string
  sort?: SortOption
  platform?: string
  price?: string
  minStars?: string
  publishedFrom?: string
  creator?: string
  page?: string
}

export async function AgentResults({
  search,
  category,
  tag,
  sort,
  platform,
  price,
  minStars,
  publishedFrom,
  creator,
  page,
}: AgentResultsProps) {
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1)
  const { agents, totalCount } = await getAgents(
    search,
    category,
    tag,
    sort,
    platform,
    price,
    minStars,
    publishedFrom,
    creator,
    pageNum,
    DEFAULT_PAGE_SIZE
  )

  const hasFilter =
    search ||
    category ||
    tag ||
    platform ||
    price ||
    minStars ||
    publishedFrom ||
    creator

  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE) || 1

  const searchParams = new URLSearchParams()
  if (search) searchParams.set("search", search)
  if (category) searchParams.set("category", category)
  if (tag) searchParams.set("tag", tag)
  if (sort) searchParams.set("sort", sort)
  if (platform) searchParams.set("platform", platform)
  if (price) searchParams.set("price", price)
  if (minStars) searchParams.set("minStars", minStars)
  if (publishedFrom) searchParams.set("publishedFrom", publishedFrom)
  if (creator) searchParams.set("creator", creator)

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
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} order={i} showPrice />
        ))}
      </div>
      <ExplorePagination
        currentPage={pageNum}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </div>
  )
}
