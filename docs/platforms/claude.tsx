import Link from "next/link"

export default function DocsClaudePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Claude Code</h1>
        <p className="text-muted-foreground">
          Build, publish, and manage agents with Claude Code on Web42.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Getting Started</h2>
        <p className="text-muted-foreground">
          To initialize a Claude agent, use the following command:
          <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`web42 init`}
          </pre>
          The CLI will guide you through naming your agent and setting it up for the marketplace.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Key Commands</h2>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Push to Marketplace</h3>
          <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`web42 push`}
          </pre>
          <p className="text-muted-foreground">
            Use this command to publish your agent to the marketplace.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Install from Marketplace</h3>
          <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`web42 install @username/agent-name`}
          </pre>
          <p className="text-muted-foreground">
            There are two types of installations: 
            <ul>
              <li>Local install: <code className="rounded bg-muted px-1 py-0.5 text-xs">web42 install @username/agent-name</code></li>
              <li>Global install: <code className="rounded bg-muted px-1 py-0.5 text-xs">web42 install -g @username/agent-name</code></li>
            </ul>
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Directory Structure</h2>
        <p className="text-muted-foreground">
          Web42 looks for agent files in the following locations:
          <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`agents/<name>.md`}
{`.claude/agents/<name>.md`}
{`~/.claude/agents/<name>.md`}
          </pre>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Config Variables</h2>
        <p className="text-muted-foreground">
          Agents can declare runtime configuration variables in their YAML frontmatter, which users fill in during installation. Example:
          <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`variables:
  - name: API_KEY
    description: Your API key for the service
    required: true`}
          </pre>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Security Model</h2>
        <p className="text-muted-foreground">
          Marketplace-installed agents have specific security filters that local agents do not, protecting user environments.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tracking Installed Agents</h2>
        <p className="text-muted-foreground">
          Web42 tracks installed agents in <code className="rounded bg-muted px-1 py-0.5 text-xs">.web42/installed.json</code>, enabling clean uninstalls.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Next Steps</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link
              href="/docs/publishing"
              className="text-foreground underline underline-offset-4"
            >
              Publishing guide
            </Link>
          </li>
          <li>
            <Link
              href="/docs/cli"
              className="text-foreground underline underline-offset-4"
            >
              CLI reference
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}