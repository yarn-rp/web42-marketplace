import { ReactElement, Suspense } from "react"
import type { Metadata } from "next"

import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Explore AI Agents",
  description:
    "Browse and discover expert-built AI agents on the Web42 marketplace. Filter by platform, category, and more.",
}
import { FadeIn } from "@/components/cult/fade-in"
import { GradientHeading } from "@/components/cult/gradient-heading"
import { AgentResults } from "@/components/agent-results"
import { AgentResultsSkeleton } from "@/components/agent-results-skeleton"
import { AgentSearch } from "@/components/agent-search"
import { ExploreFilters } from "@/components/explore-filters"
import { SortSelect } from "@/components/sort-select"
import type { SortOption } from "../actions/agent"

export const dynamic = "force-dynamic"

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: {
    search?: string
    tag?: string
    sort?: SortOption
    minStars?: string
    publishedFrom?: string
    creator?: string
    page?: string
  }
}): Promise<ReactElement> {
  const {
    search,
    tag,
    sort,
    minStars,
    publishedFrom,
    creator,
    page,
  } = searchParams

  const hasFilter =
    search || tag || minStars || publishedFrom || creator

  const suspenseKey = JSON.stringify({
    search,
    tag,
    sort,
    minStars,
    publishedFrom,
    creator,
    page,
  })

  return (
    <div className="w-full">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-4 sm:px-6">
          {hasFilter ? (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {search ? "Search" : "Tag"}
              </p>
              <GradientHeading size="xxl">
                {search ?? tag}
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
              <ExploreFilters />
              <SortSelect current={sort} />
            </div>
          </div>

          <Separator className="mb-8" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <Suspense key={suspenseKey} fallback={<AgentResultsSkeleton />}>
            <AgentResults
              search={search}
              tag={tag}
              sort={sort}
              minStars={minStars}
              publishedFrom={publishedFrom}
              creator={creator}
              page={page}
            />
          </Suspense>
        </div>
      </FadeIn>
    </div>
  )
}
