import { ReactElement, Suspense } from "react"

import { Separator } from "@/components/ui/separator"
import { FadeIn } from "@/components/cult/fade-in"
import { GradientHeading } from "@/components/cult/gradient-heading"
import { AgentResults } from "@/components/agent-results"
import { AgentResultsSkeleton } from "@/components/agent-results-skeleton"
import { AgentSearch } from "@/components/agent-search"
import { ExploreFilters } from "@/components/explore-filters"
import { SortSelect } from "@/components/sort-select"
import { getCachedCategories } from "../actions/filters"
import type { SortOption } from "../actions/agent"

export const dynamic = "force-dynamic"

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: {
    search?: string
    category?: string
    tag?: string
    sort?: SortOption
    platform?: string
  }
}): Promise<ReactElement> {
  const { search, category, tag, sort, platform } = searchParams
  const categories = await getCachedCategories()

  const hasFilter = search || category || tag || platform

  const suspenseKey = JSON.stringify({ search, category, tag, sort, platform })

  return (
    <div className="w-full">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-4 sm:px-6">
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
            <div className="flex items-center gap-2">
              <ExploreFilters categories={categories} />
              <SortSelect current={sort} />
            </div>
          </div>

          <Separator className="mb-8" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <Suspense key={suspenseKey} fallback={<AgentResultsSkeleton />}>
            <AgentResults
              search={search}
              category={category}
              tag={tag}
              sort={sort}
              platform={platform}
            />
          </Suspense>
        </div>
      </FadeIn>
    </div>
  )
}
