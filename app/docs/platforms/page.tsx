import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Supported Platforms",
  description:
    "Platforms and AI runtimes supported by Web42 agents — Claude, Codex, OpenCode, OpenClaw, and more.",
}

export default function DocsPlatformsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Supported Platforms</h1>
        <p className="text-muted-foreground">
          Platforms are the AI runtimes where your agents run.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">What are platforms?</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            Each agent on Web42 targets a specific platform — the AI runtime
            environment where it operates. The platform is declared in the{" "}
            <code className="text-foreground">platform</code> field of your{" "}
            <code className="text-foreground">manifest.json</code>.
          </p>
          <p>
            The Web42 CLI provides platform-specific commands for installing,
            uninstalling, updating, and listing agents. As new platforms are
            supported, each gets its own adapter with tailored install and
            management workflows.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Active platforms</h2>
        <div className="flex flex-col gap-4">
          <Link
            href="/docs/platforms/openclaw"
            className="block rounded-lg border p-6 transition-colors hover:border-foreground/20"
          >
            <h3 className="mb-2 text-lg font-medium">OpenClaw</h3>
            <p className="mb-4 text-muted-foreground">
              Personal AI agents with persistent identity, memory across sessions,
              skills as capabilities, and multi-channel presence (web chat,
              Discord, WhatsApp, Telegram). OpenClaw agents are opinionated — they
              have their own personality, preferences, and behavioral boundaries.
            </p>
            <span className="text-sm font-medium text-primary">
              Read the guide →
            </span>
          </Link>
          <Link
            href="/docs/platforms/claude"
            className="block rounded-lg border p-6 transition-colors hover:border-foreground/20"
          >
            <h3 className="mb-2 text-lg font-medium">Claude Code</h3>
            <p className="mb-4 text-muted-foreground">
              Anthropic&apos;s coding agent. Publish and install agents that
              extend Claude Code with specialized skills, commands, and custom
              personas. Supports local install (project-scoped) and global
              install (available in all Claude Code sessions).
            </p>
            <span className="text-sm font-medium text-primary">
              Read the guide →
            </span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Coming soon</h2>
        <p className="mb-4 text-muted-foreground">
          Agents for these platforms will follow the same publish workflow (
          <code className="text-foreground">web42 init</code> →{" "}
          <code className="text-foreground">web42 push</code>) with
          platform-specific install adapters.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-6 opacity-60">
            <h3 className="mb-2 text-lg font-medium">OpenCode</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered coding assistant. Build agents that help developers
              write, review, and refactor code.
            </p>
          </div>
          <div className="rounded-lg border p-6 opacity-60">
            <h3 className="mb-2 text-lg font-medium">Codex</h3>
            <p className="text-sm text-muted-foreground">
              OpenAI&apos;s coding agent. Publish agents that use Codex for
              autonomous code generation and problem solving.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Building for a platform
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>
            Each agent targets exactly one platform, set via the{" "}
            <code className="text-foreground">platform</code> field in{" "}
            <code className="text-foreground">manifest.json</code>.
          </li>
          <li>
            The{" "}
            <Link
              href="/docs/cli"
              className="text-primary underline underline-offset-4"
            >
              <code>web42 init</code>
            </Link>{" "}
            command lets you select which platform to target.
          </li>
          <li>
            Platform-specific files are scaffolded based on your selection.
          </li>
          <li>
            The same publish workflow applies to all platforms:{" "}
            <code className="text-foreground">web42 init</code> → build your
            agent →{" "}
            <Link
              href="/docs/publishing"
              className="text-primary underline underline-offset-4"
            >
              <code>web42 push</code>
            </Link>
            .
          </li>
        </ul>
      </section>
    </div>
  )
}
