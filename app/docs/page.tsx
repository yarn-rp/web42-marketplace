import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Learn how to discover, install, publish, and monetize AI agent packages on the Web42 marketplace.",
}

export default function DocsOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Documentation</h1>
        <p className="text-muted-foreground">
          Learn how to discover, publish, and monetize agent packages on Web42.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">What is Web42?</h2>
        <p className="mb-3 text-muted-foreground">
          Web42 is an AI Agent Marketplace where engineers publish, share, and
          sell agentic solutions as platform-native packages for AI agent
          runtimes. There are two sides to the marketplace: install agents in
          seconds via the CLI, or publish your own and earn from your work.
        </p>
        <p className="text-muted-foreground">
          Web42 currently supports{" "}
          <Link
            href="/docs/platforms/openclaw"
            className="font-medium text-foreground underline underline-offset-4"
          >
            OpenClaw
          </Link>
          , with OpenCode, Claude Code, and Codex coming soon.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Key concepts</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="mb-1 font-semibold">Agent</h3>
            <p className="text-sm text-muted-foreground">
              A packaged AI persona with skills, identity, memory, and tools,
              targeting a specific platform.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-1 font-semibold">Skill</h3>
            <p className="text-sm text-muted-foreground">
              A self-contained capability defined in a{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                SKILL.md
              </code>{" "}
              file inside a{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                skills/
              </code>{" "}
              directory.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-1 font-semibold">Manifest</h3>
            <p className="text-sm text-muted-foreground">
              The{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                manifest.json
              </code>{" "}
              file that describes an agent&apos;s metadata — name, version,
              skills, config, and more.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-1 font-semibold">Platform</h3>
            <p className="text-sm text-muted-foreground">
              The AI runtime where an agent runs (e.g., OpenClaw). Each agent
              targets exactly one platform.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Two paths</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 text-lg font-semibold">
              I want to install agents
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Browse the marketplace, pick an agent, and install it with a
              single CLI command. Your agent is ready to use in seconds.
            </p>
            <div className="mb-4 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              <code>web42 openclaw install @username/agent-name</code>
            </div>
            <Link
              href="/docs/quickstart#install"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Get started installing →
            </Link>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 text-lg font-semibold">
              I want to publish agents
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Package your agent with a manifest, publish it to the marketplace,
              and optionally set a price. Earn every time someone installs your
              agent.
            </p>
            <div className="mb-4 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              <code>web42 init && web42 push</code>
            </div>
            <Link
              href="/docs/quickstart#publish"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Get started publishing →
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">How agents are ranked</h2>
        <p className="mb-3 text-muted-foreground">
          Agents are sorted by a combination of stars, install count, and
          recency. Featured agents on the home page are curated by the Web42
          team.
        </p>
        <p className="text-muted-foreground">
          Full-text search covers three fields with decreasing weight: agent
          name (highest), description and skills, and readme content. This means
          a match on the agent name ranks higher than a match buried in the
          readme.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Browse the marketplace</h2>
        <p className="mb-3 text-muted-foreground">
          Head to the{" "}
          <Link
            href="/explore"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Explore
          </Link>{" "}
          page to browse all published agents. You can filter by platform,
          category, or tags, and sort by latest, most popular, or most starred.
        </p>
        <p className="text-muted-foreground">
          The search bar returns instant results as you type — no need to hit
          enter.
        </p>
      </section>
    </div>
  )
}
