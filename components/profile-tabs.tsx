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
import { ProfileReadmeEditor } from "@/components/profile-readme-editor"
import { SellerDashboard } from "@/components/seller-dashboard"
import { StripeConnectButton } from "@/components/stripe-connect-button"

interface ProfileTabsProps {
  profile: Profile
  agents: Agent[]
  sellerOrders: Order[]
  isOwner: boolean
  profileUsername: string
}

export function ProfileTabs({
  profile,
  agents,
  sellerOrders,
  isOwner,
  profileUsername,
}: ProfileTabsProps) {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "marketplace" ? "marketplace" : "overview"

  if (!isOwner) {
    return (
      <>
        {profile.profile_readme && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">About</h2>
            <div className="rounded-lg border bg-muted/30 p-6">
              <MarkdownRenderer content={profile.profile_readme} />
            </div>
          </section>
        )}

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
        <section>
          <ProfileReadmeEditor
            initialContent={profile.profile_readme ?? ""}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Your Agents</h2>
          <ProfileAgentGrid
            agents={agents}
            isOwner
            profileUsername={profileUsername}
          />
        </section>
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
