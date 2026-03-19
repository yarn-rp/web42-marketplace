import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Monetization",
  description:
    "Price your AI agents, connect Stripe, and earn from your work on the Web42 marketplace.",
}

export default function DocsMonetizationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Monetization</h1>
        <p className="text-muted-foreground">
          Price your agents, connect Stripe, and earn from your work.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Free vs paid agents</h2>
        <p className="text-muted-foreground">
          Every agent on Web42 is either free or paid. You choose the model when
          configuring your agent.
        </p>

        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="font-medium">Free agents</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Anyone can acquire access with one click using the{" "}
              <span className="font-medium text-foreground">
                &ldquo;Get for Free&rdquo;
              </span>{" "}
              button. No payment required &mdash; the agent is immediately
              available to the user.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="font-medium">Paid agents</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Paid agents have a minimum price of{" "}
              <span className="font-medium text-foreground">$5 USD</span>. You
              set the price in the agent&rsquo;s Settings tab on the
              marketplace. The price is displayed to buyers on the agent detail
              page.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Revenue model</h2>
        <p className="text-muted-foreground">
          Web42 charges a <span className="font-medium text-foreground">10% platform fee</span> on
          every paid sale. The creator receives{" "}
          <span className="font-medium text-foreground">90%</span> of each
          transaction. Fees are calculated and handled automatically via Stripe
          Connect &mdash; no manual invoicing needed.
        </p>

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="mb-3 text-sm font-medium">
            Example: a $10 agent sale
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-md bg-emerald-500/15 px-3 py-2 text-center">
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                $9.00
              </p>
              <p className="text-xs text-muted-foreground">Creator (90%)</p>
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-center">
              <p className="text-lg font-semibold">$1.00</p>
              <p className="text-xs text-muted-foreground">Web42 (10%)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Setting up Stripe</h2>
        <p className="text-muted-foreground">
          To sell paid agents you need a connected Stripe account. Follow these
          steps to get set up:
        </p>

        <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
          <li>
            Go to{" "}
            <span className="font-medium text-foreground">Settings</span>{" "}
            &gt;{" "}
            <span className="font-medium text-foreground">Payouts</span> on
            the Web42 marketplace.
          </li>
          <li>
            Click{" "}
            <span className="font-medium text-foreground">
              &ldquo;Connect with Stripe&rdquo;
            </span>{" "}
            &mdash; this creates a Stripe Express account linked to your Web42
            profile.
          </li>
          <li>
            Complete Stripe&rsquo;s onboarding flow: identity verification and
            bank/payout details.
          </li>
          <li>
            You must finish Stripe onboarding before you can list paid agents
            for sale.
          </li>
        </ol>

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="mb-2 text-sm font-medium">
            Stripe connection states
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Not connected
              </span>{" "}
              &mdash; initial state; no Stripe account linked.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Onboarding incomplete
              </span>{" "}
              &mdash; you started but didn&rsquo;t finish. A{" "}
              <span className="font-medium text-foreground">
                &ldquo;Complete Stripe Setup&rdquo;
              </span>{" "}
              button will appear.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Payouts enabled
              </span>{" "}
              &mdash; fully connected. You&rsquo;ll see a{" "}
              <span className="font-medium text-foreground">
                &ldquo;Manage on Stripe&rdquo;
              </span>{" "}
              link to access your Stripe dashboard.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How purchases work</h2>
        <p className="text-muted-foreground">
          Here&rsquo;s the end-to-end flow when someone buys a paid agent:
        </p>

        <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
          <li>
            The buyer clicks{" "}
            <span className="font-medium text-foreground">
              &ldquo;Get&rdquo;
            </span>{" "}
            on the paid agent&rsquo;s detail page.
          </li>
          <li>
            They are redirected to{" "}
            <span className="font-medium text-foreground">
              Stripe Checkout
            </span>{" "}
            to complete payment.
          </li>
          <li>
            On successful payment an order is created with status{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              completed
            </code>
            , and access is granted to the buyer via an{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              agent_access
            </code>{" "}
            record.
          </li>
          <li>
            The buyer can now view the agent&rsquo;s files and content, and
            install it via the{" "}
            <Link
              href="/docs/cli"
              className="font-medium text-foreground underline underline-offset-4"
            >
              CLI
            </Link>
            .
          </li>
          <li>
            Order history is available for both buyers and sellers on their
            respective dashboards.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Refunds</h2>
        <p className="text-muted-foreground">
          Web42 offers a{" "}
          <span className="font-medium text-foreground">
            3-day (72-hour) refund window
          </span>{" "}
          from the date of purchase.
        </p>

        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>
            Buyers can request a refund from their order history within 3 days
            (72 hours) of the original purchase.
          </li>
          <li>
            When a refund is processed: Stripe handles the refund, the
            buyer&rsquo;s access to the agent is revoked, and the order status
            is updated to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              refunded
            </code>
            .
          </li>
          <li>After 3 days (72 hours) from purchase, refunds are no longer available.</li>
          <li>Partial refunds are not supported.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Access model</h2>
        <p className="text-muted-foreground">
          Access determines what a user can do with an agent. Here&rsquo;s how
          it works:
        </p>

        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="font-medium">Owner</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Always has full access to their own agents, regardless of pricing.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="font-medium">Free agents</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Access is granted the moment a user clicks &ldquo;Get for
              Free&rdquo;.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="font-medium">Paid agents</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Access is granted only after a successful purchase through Stripe
              Checkout.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="mb-2 text-sm font-medium">What access unlocks</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>
              Viewing the agent&rsquo;s files in the{" "}
              <span className="font-medium text-foreground">Content</span> tab
            </li>
            <li>
              Installing the agent via the{" "}
              <Link
                href="/docs/cli"
                className="font-medium text-foreground underline underline-offset-4"
              >
                CLI
              </Link>
            </li>
            <li>Remixing the agent to create your own version</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="mb-1 text-sm font-medium">Revocation</p>
          <p className="text-sm text-muted-foreground">
            If a refund is processed, the buyer&rsquo;s access is immediately
            revoked. They will no longer be able to view files, install, or
            remix the agent.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Next steps</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>
            <Link
              href="/docs/publishing"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Publishing
            </Link>{" "}
            &mdash; learn how to publish your agent to the marketplace
          </li>
          <li>
            <Link
              href="/docs/cli"
              className="font-medium text-foreground underline underline-offset-4"
            >
              CLI reference
            </Link>{" "}
            &mdash; install and manage agents from the command line
          </li>
          <li>
            <Link
              href="/docs/platforms/openclaw"
              className="font-medium text-foreground underline underline-offset-4"
            >
              OpenClaw platform
            </Link>{" "}
            &mdash; explore the default agent platform
          </li>
        </ul>
      </section>
    </div>
  )
}
