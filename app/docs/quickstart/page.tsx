import Link from "next/link"

import { CliInstallBlock } from "@/components/landing/cli-install-block"

export default function DocsQuickstartPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Quick Start</h1>
        <p className="text-muted-foreground">
          Get up and running with Web42 in minutes.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Prerequisites</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>A GitHub account (used for authentication)</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Install the CLI</h2>
        <p className="mb-4 text-muted-foreground">
          The Web42 CLI is required for all marketplace operations — searching,
          installing, and publishing agents.
        </p>
        <CliInstallBlock />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Authenticate</h2>
        <p className="mb-4 text-muted-foreground">
          Log in with your GitHub account. This opens your browser for OAuth
          authorization and the CLI polls until approved.
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <code>web42 auth login</code>
        </div>
        <p className="mt-4 mb-4 text-muted-foreground">
          Verify your session at any time. This displays your username and auth
          status.
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <code>web42 auth whoami</code>
        </div>
      </section>

      <section>
        <h2 id="install" className="mb-4 text-xl font-semibold">
          Install your first agent
        </h2>
        <ol className="list-decimal pl-6 space-y-4 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Search</span> for an
            agent by keyword. Results show the name, description, and install
            command for each match.
            <div className="mt-2 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              <code>web42 search &quot;customer support&quot;</code>
            </div>
          </li>
          <li>
            <span className="font-medium text-foreground">Install</span> the
            agent into your OpenClaw workspace.
            <div className="mt-2 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              <code>web42 openclaw install @username/agent-name</code>
            </div>
          </li>
          <li>
            If the agent requires config variables (API keys, tokens, etc.),
            you will be prompted to enter them during installation.
          </li>
          <li>
            The agent is now ready to use in your OpenClaw environment.
          </li>
          <li>
            <span className="font-medium text-foreground">Manage</span> your
            installed agents with the following commands.
            <div className="mt-2 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              <pre>{`web42 openclaw list      # see installed agents
web42 openclaw update    # update all agents`}</pre>
            </div>
          </li>
        </ol>
      </section>

      <section>
        <h2 id="publish" className="mb-4 text-xl font-semibold">
          Publish your first agent
        </h2>
        <ol className="list-decimal pl-6 space-y-4 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Initialize</span>{" "}
            your agent project. The interactive prompts walk you through
            platform selection (OpenClaw), agent name (lowercase + hyphens),
            description, version (semver), category, tags, model preferences,
            and demo video URL. Skills are auto-detected from{" "}
            <code className="text-sm">skills/*/SKILL.md</code>.
            <div className="mt-2 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              <code>web42 init</code>
            </div>
          </li>
          <li>
            This creates <code className="text-sm">manifest.json</code> and
            scaffolds your platform files:{" "}
            <code className="text-sm">AGENTS.md</code>,{" "}
            <code className="text-sm">IDENTITY.md</code>,{" "}
            <code className="text-sm">SOUL.md</code>,{" "}
            <code className="text-sm">TOOLS.md</code>,{" "}
            <code className="text-sm">USER.md</code>,{" "}
            <code className="text-sm">HEARTBEAT.md</code>, and{" "}
            <code className="text-sm">BOOTSTRAP.md</code>. See the{" "}
            <Link
              href="/docs/platforms/openclaw"
              className="text-primary underline underline-offset-4"
            >
              OpenClaw platform guide
            </Link>{" "}
            for what each file does.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Build your agent
            </span>{" "}
            — customize the scaffolded files to define your agent&apos;s
            personality, capabilities, and behavior.
          </li>
          <li>
            <span className="font-medium text-foreground">Push</span> your
            agent to the marketplace. This bundles and uploads all files. Your
            agent starts as private by default.
            <div className="mt-2 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              <code>web42 push</code>
            </div>
          </li>
          <li>
            <span className="font-medium text-foreground">
              Configure on the marketplace
            </span>{" "}
            — visit your agent&apos;s page to set a profile image, license,
            tags, resources, readme, and pricing. Toggle visibility to public
            when you are ready to publish. See the{" "}
            <Link
              href="/docs/publishing"
              className="text-primary underline underline-offset-4"
            >
              full publishing guide
            </Link>{" "}
            for details.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">What&apos;s next?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <Link
              href="/docs/publishing"
              className="text-primary underline underline-offset-4"
            >
              Publishing Guide
            </Link>{" "}
            <span className="text-muted-foreground">
              — Full walkthrough for preparing and releasing agents
            </span>
          </li>
          <li>
            <Link
              href="/docs/cli"
              className="text-primary underline underline-offset-4"
            >
              CLI Reference
            </Link>{" "}
            <span className="text-muted-foreground">
              — Complete command reference for the Web42 CLI
            </span>
          </li>
          <li>
            <Link
              href="/docs/platforms/openclaw"
              className="text-primary underline underline-offset-4"
            >
              OpenClaw Platform
            </Link>{" "}
            <span className="text-muted-foreground">
              — Deep dive into building agents for OpenClaw
            </span>
          </li>
          <li>
            <Link
              href="/docs/monetization"
              className="text-primary underline underline-offset-4"
            >
              Monetization
            </Link>{" "}
            <span className="text-muted-foreground">
              — How to price and sell your agents
            </span>
          </li>
          <li>
            <Link
              href="/explore"
              className="text-primary underline underline-offset-4"
            >
              Explore the Marketplace
            </Link>{" "}
            <span className="text-muted-foreground">
              — Browse and discover agents built by the community
            </span>
          </li>
        </ul>
      </section>
    </div>
  )
}
