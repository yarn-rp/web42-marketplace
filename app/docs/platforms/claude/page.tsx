import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Claude Code — Web42 Docs",
  description:
    "Publish and install Claude Code agents on Web42. Covers local vs global install, template variables, config variables, and the security model.",
}

export default function DocsClaudePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Claude Code</h1>
        <p className="text-muted-foreground">
          Package requirements, installation flow, and security model for Claude
          Code agents on Web42.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-muted-foreground">
          Claude Code agents are{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.md</code>{" "}
          files with YAML frontmatter that define an agent&apos;s name,
          description, model, and referenced skills. Web42 lets you publish
          these agents to the marketplace and install others&apos; agents
          directly into your Claude Code environment — either scoped to a
          specific project or available globally. For general publishing
          concepts see the{" "}
          <Link
            href="/docs/publishing"
            className="text-foreground underline underline-offset-4"
          >
            Publishing guide
          </Link>
          .
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Getting started</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>Initialize a Claude agent, publish it, and install from the marketplace:</p>
        </div>
        <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`# Scaffold a new Claude agent
web42 init                          # select Claude from the list

# Publish to the marketplace
web42 push

# Install an agent (local to current project)
web42 install @username/agent-name

# Install globally (available in all Claude Code sessions)
web42 install -g @username/agent-name`}
        </pre>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Directory structure</h2>
        <p className="text-muted-foreground">
          The CLI discovers agents, skills, and commands from these locations:
        </p>
        <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`your-project/
├── agents/
│   └── my-agent.md          # agent definition
├── .claude/
│   └── agents/
│       └── my-agent.md      # alternative location (project-local)
├── skills/
│   └── my-skill/
│       └── SKILL.md         # referenced skill
└── commands/
    └── my-command.md        # custom slash command`}
        </pre>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Agents</strong> — scanned from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">agents/</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">.claude/agents/</code>, and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">~/.claude/agents/</code>
          </p>
          <p>
            <strong className="text-foreground">Skills</strong> — resolved from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">skills/</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">.claude/skills/</code>, and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">~/.claude/skills/</code>
          </p>
          <p>
            <strong className="text-foreground">Commands</strong> — packed from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">commands/</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">.claude/commands/</code>
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Local vs global install</h2>
        <p className="text-muted-foreground">
          Claude Code supports two install scopes. Web42 mirrors this with the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">-g</code> flag.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-5 space-y-3">
            <h3 className="font-semibold">Local (default)</h3>
            <pre className="rounded bg-muted/50 p-3 font-mono text-xs">
{`web42 install @username/agent`}
            </pre>
            <p className="text-sm text-muted-foreground">
              Installs into <code className="rounded bg-muted px-1 py-0.5 text-xs">.claude/</code> in your current working directory. The agent is only available when Claude Code is opened in that project.
            </p>
            <p className="text-sm text-muted-foreground">
              Best for: agents purpose-built for a specific repo or team.
            </p>
          </div>
          <div className="rounded-lg border p-5 space-y-3">
            <h3 className="font-semibold">Global</h3>
            <pre className="rounded bg-muted/50 p-3 font-mono text-xs">
{`web42 install -g @username/agent`}
            </pre>
            <p className="text-sm text-muted-foreground">
              Installs into <code className="rounded bg-muted px-1 py-0.5 text-xs">~/.claude/</code>. The agent is available in every Claude Code session regardless of which project you have open.
            </p>
            <p className="text-sm text-muted-foreground">
              Best for: general-purpose agents you want everywhere.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          You can also install under a custom name with{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">--as &lt;name&gt;</code>:
        </p>
        <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`web42 install @username/agent-name --as my-custom-name`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Template variables</h2>
        <p className="text-muted-foreground">
          When you publish an agent, hardcoded filesystem paths are
          automatically replaced with portable placeholders. At install time,
          placeholders resolve to the correct path on the buyer&apos;s machine.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Placeholder</th>
                <th className="px-4 py-3 text-left font-medium">Resolves to</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">{"{{CLAUDE_HOME}}"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">~/.claude</code> (macOS, Linux, Windows)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          For example, a path like{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/Users/you/.claude/skills/my-skill</code>{" "}
          becomes{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{{CLAUDE_HOME}}/skills/my-skill"}</code>{" "}
          when published, and resolves correctly on any buyer&apos;s machine.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Config variables</h2>
        <p className="text-muted-foreground">
          Agents can declare runtime configuration variables that users fill in
          at install time. Declare them in the agent&apos;s YAML frontmatter:
        </p>
        <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`---
name: My Agent
description: Does useful things
variables:
  - name: API_KEY
    description: Your API key for the service
    required: true
  - name: PREFERRED_LANGUAGE
    description: Default language for responses
    required: false
---`}
        </pre>
        <p className="text-muted-foreground">
          Use placeholders anywhere in the agent&apos;s files:
        </p>
        <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`Your API key is {{API_KEY}}.
Respond in {{PREFERRED_LANGUAGE}} by default.`}
        </pre>
        <p className="text-sm text-muted-foreground">
          The CLI prompts the user for values at install time and replaces all
          placeholders before writing files to disk.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Security model</h2>
        <p className="text-muted-foreground">
          Web42 applies a security filter to marketplace-installed agents that
          does not apply to your own local agents.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Key</th>
                <th className="px-4 py-3 text-left font-medium">Your local agents</th>
                <th className="px-4 py-3 text-left font-medium">Marketplace agents</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3 font-mono text-xs">hooks</td>
                <td className="px-4 py-3 text-green-600 dark:text-green-400">✓ Allowed</td>
                <td className="px-4 py-3 text-muted-foreground">Stripped on install</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">mcpServers</td>
                <td className="px-4 py-3 text-green-600 dark:text-green-400">✓ Allowed</td>
                <td className="px-4 py-3 text-muted-foreground">Stripped on install</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">permissionMode</td>
                <td className="px-4 py-3 text-green-600 dark:text-green-400">✓ Allowed</td>
                <td className="px-4 py-3 text-muted-foreground">Stripped on install</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          These keys control system-level behavior — shell hooks, MCP server
          connections, and permission escalation. Stripping them prevents
          marketplace agents from silently modifying your Claude Code security
          posture. If keys are stripped during install, the CLI prints a
          warning.
        </p>
        <p className="text-sm text-muted-foreground">
          For full details see the{" "}
          <Link
            href="/docs/platforms"
            className="text-foreground underline underline-offset-4"
          >
            security documentation
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What gets packed</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Item</th>
                <th className="px-4 py-3 text-left font-medium">Included</th>
              </tr>
            </thead>
            <tbody className="divide-y text-muted-foreground">
              <tr>
                <td className="px-4 py-3">Agent <code className="rounded bg-muted px-1 py-0.5 text-xs">.md</code> file</td>
                <td className="px-4 py-3 text-green-600 dark:text-green-400">✓</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Referenced skill <code className="rounded bg-muted px-1 py-0.5 text-xs">SKILL.md</code> files</td>
                <td className="px-4 py-3 text-green-600 dark:text-green-400">✓</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Command files (<code className="rounded bg-muted px-1 py-0.5 text-xs">commands/*.md</code>)</td>
                <td className="px-4 py-3 text-green-600 dark:text-green-400">✓</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Settings files (<code className="rounded bg-muted px-1 py-0.5 text-xs">.claude/settings*</code>)</td>
                <td className="px-4 py-3">✗</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Memory files (<code className="rounded bg-muted px-1 py-0.5 text-xs">MEMORY.md</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">memory/</code>)</td>
                <td className="px-4 py-3">✗</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Environment files (<code className="rounded bg-muted px-1 py-0.5 text-xs">.env*</code>)</td>
                <td className="px-4 py-3">✗</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><code className="rounded bg-muted px-1 py-0.5 text-xs">.git/</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">node_modules/</code></td>
                <td className="px-4 py-3">✗</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
