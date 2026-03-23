import { getFeaturedAgents } from "./actions/agent"
import { HeroSection } from "@/components/landing/hero-section"
import { SupportedPlatforms } from "@/components/landing/supported-platforms"
import { CreatorCTA } from "@/components/landing/creator-cta"
import { FinalCTA } from "@/components/landing/final-cta"
import { FeaturedSection } from "@/components/landing/featured-section"

async function Page() {
  const featured = await getFeaturedAgents()

  return (
    <div className="relative w-full">
      <div className="dot-grid pointer-events-none fixed inset-0 z-0" />

      <div className="relative z-10">
        <HeroSection />

        <SupportedPlatforms />

        <FeaturedSection
          featured={featured}
        />

        <CreatorCTA />

        <FinalCTA />
      </div>
    </div>
  )
}

export default Page
