import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Access Model",
  description:
    "How agent access works on the Web42 marketplace.",
}

export default function DocsMonetizationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Access Model</h1>
        <p className="text-muted-foreground">
          How access to agents works on the Web42 marketplace.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Free agents</h2>
        <p className="text-muted-foreground">
          All agents on Web42 are free. Anyone can acquire access with one
          click using the{" "}
          <span className="font-medium text-foreground">
            &ldquo;Get for Free&rdquo;
          </span>{" "}
          button. No payment required &mdash; the agent is immediately
          available.
        </p>
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
              Always has full access to their own agents.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="font-medium">Other users</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Access is granted the moment a user clicks &ldquo;Get for
              Free&rdquo;.
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
