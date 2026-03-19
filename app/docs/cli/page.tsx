import Link from "next/link"
import type { Metadata } from "next"

import { CliInstallBlock } from "@/components/landing/cli-install-block"

export const metadata: Metadata = {
  title: "CLI Reference",
  description:
    "Complete command reference for the Web42 CLI. Install, search, publish, and manage AI agents from the terminal.",
}

export default function DocsCliPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">CLI Reference</h1>
        <p className="text-muted-foreground">
          Complete command reference for the Web42 CLI.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Installation</h2>
        <p className="text-muted-foreground">
          Install the Web42 CLI using any of the methods below. No runtime
          dependencies required.
        </p>
        <CliInstallBlock />
        <p className="text-muted-foreground">
          Verify the installation by checking the version:
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          web42 --version
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Global options</h2>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          --api-url &lt;url&gt;
        </div>
        <p className="text-muted-foreground">
          Overrides the API URL for a single invocation. Useful for development
          or self-hosted instances.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Authentication</h2>
        <p className="text-muted-foreground">
          Manage your Web42 credentials. Authentication uses GitHub OAuth device
          flow.
        </p>

        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-lg font-medium">auth login</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 auth login
            </div>
            <p className="text-muted-foreground">
              Starts the GitHub OAuth device flow. Opens your browser for
              authorization and polls until the flow completes. Your auth token
              is stored locally.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">auth logout</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 auth logout
            </div>
            <p className="text-muted-foreground">
              Clears stored credentials from your machine.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">auth whoami</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 auth whoami
            </div>
            <p className="text-muted-foreground">
              Displays your authenticated username and current API URL.
            </p>
          </section>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Agent commands</h2>
        <p className="text-muted-foreground">
          Create, bundle, and publish agents to the marketplace. See the{" "}
          <Link
            href="/docs/quickstart"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Quickstart
          </Link>{" "}
          and{" "}
          <Link
            href="/docs/publishing"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Publishing guide
          </Link>{" "}
          for walkthroughs.
        </p>

        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-lg font-medium">init</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 init
            </div>
            <p className="text-muted-foreground">
              Create a <code className="text-foreground">manifest.json</code>{" "}
              interactively. Prompts for platform, name, description, version,
              category, tags, model preferences, and demo video URL. Scaffolds
              platform-specific files (AGENTS.md, IDENTITY.md, SOUL.md, etc.)
              and auto-detects skills from{" "}
              <code className="text-foreground">skills/*/SKILL.md</code>.
              Requires authentication.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">pack</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 pack [--dry-run]
            </div>
            <p className="text-muted-foreground">
              Bundle your agent into a{" "}
              <code className="text-foreground">.web42/</code> directory. Strips
              secrets from skill files and replaces them with placeholders.
              Merges config variables from skills into the manifest. Use{" "}
              <code className="text-foreground">--dry-run</code> to preview
              without writing files.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">push</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 push
            </div>
            <p className="text-muted-foreground">
              Push your agent to the Web42 marketplace. If no{" "}
              <code className="text-foreground">.web42/</code> directory exists,
              runs pack automatically first. Reads{" "}
              <code className="text-foreground">README.md</code> from the
              current directory if present and includes it. Creates a new agent
              or updates an existing one.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">pull</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 pull
            </div>
            <p className="text-muted-foreground">
              Fetch the latest version of your agent&apos;s files from the
              marketplace into your current directory.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">search</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 search &lt;query&gt;
            </div>
            <p className="text-muted-foreground">
              Search the marketplace for agents matching your query. Results show
              agent name, description, and the platform install command. Uses
              full-text search across name, description, skills, and readme.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">remix</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 remix &lt;agent&gt;
            </div>
            <p className="text-muted-foreground">
              Copy an existing agent to your account. Requires access to the
              agent (owner, free acquisition, or purchase for paid agents).
            </p>
          </section>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Configuration commands</h2>

        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-lg font-medium">config show</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 config show
            </div>
            <p className="text-muted-foreground">
              Display current configuration: API URL, authentication status, and
              username.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">config set-url</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 config set-url &lt;url&gt;
            </div>
            <p className="text-muted-foreground">
              Override the default API URL. Persists across sessions.
            </p>
          </section>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Platform commands</h2>
        <p className="text-muted-foreground">
          Platform-specific commands registered through adapters. Currently only{" "}
          <Link
            href="/docs/platforms/openclaw"
            className="underline underline-offset-4 hover:text-foreground"
          >
            OpenClaw
          </Link>{" "}
          is supported. Each platform provides install, uninstall, update, and
          list commands.
        </p>

        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-lg font-medium">openclaw install</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 openclaw install &lt;agent&gt;
            </div>
            <p className="text-muted-foreground">
              Install an agent into your OpenClaw workspace. Creates a workspace
              directory, merges configuration into{" "}
              <code className="text-foreground">openclaw.json</code>, and
              prompts for any required config variables (API keys, tokens).
              Config values are stored in{" "}
              <code className="text-foreground">.web42.config.json</code>.
            </p>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 openclaw install @alice/support-bot
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">openclaw uninstall</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 openclaw uninstall &lt;agent&gt;
            </div>
            <p className="text-muted-foreground">
              Remove an installed agent. Deletes the workspace directory and
              cleans up config entries.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">openclaw update</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 openclaw update
            </div>
            <p className="text-muted-foreground">
              Update all installed agents to their latest marketplace versions.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">openclaw list</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 openclaw list
            </div>
            <p className="text-muted-foreground">
              List all agents currently installed in your OpenClaw environment.
            </p>
          </section>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Configuration files</h2>

        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-lg font-medium">CLI config</h3>
            <p className="text-muted-foreground">
              Stored via the{" "}
              <code className="text-foreground">conf</code> package in your
              system config directory. Contains the API URL (defaults to
              production), auth token, and username. Managed by the{" "}
              <code className="text-foreground">auth</code> and{" "}
              <code className="text-foreground">config</code> commands.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">.web42.config.json</h3>
            <p className="text-muted-foreground">
              Created in the agent workspace during install. Stores config
              variable values (API keys, tokens) for each installed agent. This
              file should never be committed to version control.
            </p>
          </section>
        </div>
      </section>
    </div>
  )
}
