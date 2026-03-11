import { ReactElement } from "react"
import { Terminal } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { FadeIn } from "@/components/cult/fade-in"
import { GradientHeading } from "@/components/cult/gradient-heading"
import { AgentCard } from "@/components/agent-card"
import { AgentSearch } from "@/components/agent-search"
import { CategoryPill } from "@/components/category-pill"
import { SortSelect } from "@/components/sort-select"
import { getCachedCategories } from "../actions/filters"
import { getAgents, type SortOption } from "../actions/agent"

export const dynamic = "force-dynamic"

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: {
    search?: string
    category?: string
    tag?: string
    sort?: SortOption
  }
}): Promise<ReactElement> {
  const { search, category, tag, sort } = searchParams
  const agents = await getAgents(search, category, tag, sort)
  const categories = await getCachedCategories()

  const hasFilter = search || category || tag

  return (
    <div className="w-full">
      <FadeIn>
        <div className="mx-auto max-w-6xl px-6 pt-8 pb-4">
          {hasFilter ? (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {search ? "Search" : category ? "Category" : "Tag"}
              </p>
              <GradientHeading size="xxl">
                {search ?? category ?? tag}
              </GradientHeading>
            </div>
          ) : (
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Explore Agents</h1>
              <p className="text-sm text-muted-foreground">
                Discover agent packages from the community
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="max-w-md flex-1">
              <AgentSearch />
            </div>
            <SortSelect current={sort} />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <CategoryPill
                category={{ id: "all", name: "All", icon: null, created_at: "" }}
                active={!category}
              />
              {categories.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  category={cat}
                  active={category === cat.name}
                />
              ))}
            </div>
          )}

          <Separator className="mb-8" />
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-16">
          {agents.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed p-12 text-center">
              <Terminal className="size-10 mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">
                {hasFilter
                  ? "No agents match your filters"
                  : "No agents yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {hasFilter
                  ? "Try a different search term or category."
                  : "Be the first to publish an agent package."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {agents.map((agent, i) => (
                <AgentCard key={agent.id} agent={agent} order={i} />
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
