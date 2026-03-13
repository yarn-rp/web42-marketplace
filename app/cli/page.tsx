import { CliHero } from "@/components/cli/cli-hero"
import { CliTwoPaths } from "@/components/cli/cli-two-paths"
import { CliHowItWorks } from "@/components/cli/cli-how-it-works"
import { CliFinalCTA } from "@/components/cli/cli-final-cta"

export const metadata = {
  title: "CLI | Web42",
  description:
    "The Web42 CLI is required to use the marketplace. Install expert-built agents in seconds or publish your own and earn.",
}

export default function CliPage() {
  return (
    <div className="relative w-full">
      <div className="dot-grid pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10">
        <CliHero />
        <CliTwoPaths />
        <CliHowItWorks />
        <CliFinalCTA />
      </div>
    </div>
  )
}
