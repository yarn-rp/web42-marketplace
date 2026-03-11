import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FadeIn } from "@/components/cult/fade-in"
import { AgentCard } from "@/components/agent-card"
import { AgentSearch } from "@/components/agent-search"
import { CategoryPill } from "@/components/category-pill"
import { FeaturedCarousel } from "@/components/featured-carousel"
import { getCachedCategories } from "./actions/filters"
import { getFeaturedAgents } from "./actions/agent"

async function Page() {
  const featured = await getFeaturedAgents()
  const categories = await getCachedCategories()

  return (
    <div className="w-full">
      <FadeIn>
        {/* Hero */}
        <section className="flex flex-col items-center px-6 pt-20 pb-16 text-center">
          <Badge variant="outline" className="mb-6">
            Agent Marketplace
          </Badge>
          <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Marketplace
          </h1>
          <p className="mb-10 max-w-lg text-sm text-muted-foreground md:text-base">
            Discover, remix, and install agent packages from the community.
          </p>
          <div className="w-full max-w-md">
            <AgentSearch />
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mx-auto max-w-5xl px-6 pb-12">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <CategoryPill key={cat.id} category={cat} />
              ))}
            </div>
          </section>
        )}

        <Separator className="mx-auto max-w-6xl" />

        {/* Featured Carousel */}
        {featured.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Featured</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/explore">
                  See All
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
            <FeaturedCarousel agents={featured} />
          </section>
        )}
      </FadeIn>
    </div>
  )
}

export default Page
