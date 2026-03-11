"use client"

import type { Agent } from "@/lib/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

import { AgentCard } from "./agent-card"

export function FeaturedCarousel({ agents }: { agents: Agent[] }) {
  return (
    <Carousel
      opts={{ align: "start", loop: agents.length > 3 }}
      className="w-full"
    >
      <CarouselContent>
        {agents.map((agent, i) => (
          <CarouselItem
            key={agent.id}
            className="basis-full sm:basis-1/2 lg:basis-1/3"
          >
            <AgentCard agent={agent} order={i} trim />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-4 hidden sm:flex" />
      <CarouselNext className="-right-4 hidden sm:flex" />
    </Carousel>
  )
}
