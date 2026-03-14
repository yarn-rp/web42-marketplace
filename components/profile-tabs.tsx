"use client"

import { useSearchParams } from "next/navigation"

import type { Agent, Order, Profile } from "@/lib/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { ProfileAgentGrid } from "@/components/profile-agent-grid"
import { SellerDashboard } from "@/components/seller-dashboard"
import { StripeConnectButton } from "@/components/stripe-connect-button"

interface ProfileTabsProps {
  profile: Profile
  agents: Agent[]
  purchasedAgents?: Agent[]
  sellerOrders: Order[]
  isOwner: boolean
  profileUsername: string
}

function AboutSection({ content }: { content: string | null }) {
  if (!content) return null

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">About</h2>
      <div className="rounded-lg border bg-muted/30 p-6">
        <MarkdownRenderer content={content} />
      </div>
    </section>
  )
}

export function ProfileTabs({
  profile,
  agents,
  purchasedAgents = [],
  sellerOrders,
  isOwner,
  profileUsername,
}: ProfileTabsProps) {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "marketplace" ? "marketplace" : "overview"

  if (!isOwner) {
    return (
      <>
        <AboutSection content={profile.profile_readme} />

        <section>
          <h2 className="mb-4 text-lg font-semibold">Published Agents</h2>
          <ProfileAgentGrid
            agents={agents}
            isOwner={false}
            profileUsername={profileUsername}
          />
        </section>
      </>
    )
  }

  return (
    <Tabs defaultValue={initialTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-8">
        <AboutSection content={profile.profile_readme} />

        <section>
          <h2 className="mb-4 text-lg font-semibold">Your Agents</h2>
          <ProfileAgentGrid
            agents={agents}
            isOwner
            profileUsername={profileUsername}
          />
        </section>

        {purchasedAgents.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Purchased</h2>
            <ProfileAgentGrid
              agents={purchasedAgents}
              isOwner={false}
              profileUsername={profileUsername}
            />
          </section>
        )}
      </TabsContent>

      <TabsContent value="marketplace" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>
              Connect Stripe to sell agents and receive payouts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <StripeConnectButton
              stripeAccountId={profile.stripe_account_id}
              onboardingComplete={profile.stripe_onboarding_complete}
              payoutsEnabled={profile.stripe_payouts_enabled}
            />
            {profile.stripe_payouts_enabled && (
              <>
                <Separator />
                <SellerDashboard orders={sellerOrders} />
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
