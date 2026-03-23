import Link from "next/link"

export default function DocsOpenClawPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">OpenClaw</h1>
        <p className="text-muted-foreground">
          Package requirements, installation flow, and management for OpenClaw
          agents on Web42.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-muted-foreground">
          OpenClaw is the first platform supported by Web42. This page covers
          what an OpenClaw agent package must include, how the CLI installs it
          into your local OpenClaw environment, and how to manage installed
          agents. For general publishing concepts see the{" "}
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Package structure</h2>
          <p className="text-muted-foreground">
            When you run{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              web42 init
            </code>{" "}
            and select OpenClaw, the following files are scaffolded. Every
            OpenClaw package published to the marketplace must include these
            files.
          </p>
          <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`your-agent/
├── manifest.json        # Required — package metadata
├── AGENTS.md            # Required — operating manual
├── IDENTITY.md          # Required — agent persona
├── SOUL.md              # Required — personality & values
├── TOOLS.md             # Required — local tool notes
├── USER.md              # Auto-generated on install
├── HEARTBEAT.md         # Optional — periodic task checklist
├── BOOTSTRAP.md         # Optional — first-run setup
└── skills/              # Optional — capability modules
    └── your-skill/
        └── SKILL.md`}
          </pre>
        </div>

        <section className="space-y-4">
          <h3 className="text-lg font-medium">Required files</h3>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="font-semibold">manifest.json</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Package metadata for the marketplace. Must include{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {'"platform": "openclaw"'}
                </code>
                . Defines name, version, skills, config variables, and more. See
                the{" "}
                <Link
                  href="/docs/publishing"
                  className="text-foreground underline underline-offset-4"
                >
                  manifest.json reference
                </Link>{" "}
                for all fields.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold">AGENTS.md</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The operating manual the agent reads every session. Defines
                startup behavior (read SOUL.md → USER.md → memory files),
                memory rules, safety boundaries, group chat etiquette,
                heartbeat behavior, and any custom conventions.
                This is the most important file — it tells the agent how to
                behave.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold">IDENTITY.md</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Defines the agent&apos;s persona: name, creature type, vibe,
                signature emoji, and avatar path. Filled in by the agent during
                its first conversation with the user.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold">SOUL.md</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Core personality and behavioral guidelines — the agent&apos;s
                value system. Defines how the agent communicates, handles
                boundaries, and persists across sessions.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold">TOOLS.md</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Local infrastructure notes for the agent&apos;s environment.
                Camera names, SSH hosts, TTS voices, device nicknames — anything
                specific to the user&apos;s setup. Kept separate from skills so
                skills can be shared without leaking local details.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-medium">Optional files</h3>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="font-semibold">HEARTBEAT.md</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Periodic task checklist. When present, the agent checks this
                file on heartbeat polls and runs any listed tasks (email checks,
                calendar reviews, etc.). Leave empty or omit to skip
                heartbeats entirely.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold">BOOTSTRAP.md</p>
              <p className="mt-1 text-sm text-muted-foreground">
                First-run setup instructions. Guides the user through API key
                setup and messaging channel connections. The agent deletes this
                file after completing initial configuration.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold">skills/</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Directory of capability modules. Each skill lives in its own
                folder with a{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  SKILL.md
                </code>{" "}
                file. Skills are auto-detected during{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  web42 init
                </code>{" "}
                and{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  web42 pack
                </code>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-medium">Auto-generated on install</h3>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">USER.md</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Information about the human the agent helps (name, pronouns,
              timezone). This file is always regenerated fresh during install
              so each user gets a blank slate. Not included in the published
              package.
            </p>
          </div>
        </section>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Excluded from packages</h2>
        <p className="text-muted-foreground">
          The following files and directories are automatically excluded when
          running{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            web42 pack
          </code>
          . They never get uploaded to the marketplace:
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <pre>
{`MEMORY.md              # Private long-term memory
memory/                # Private daily session logs
sessions/              # Private session data
USER.md                # Regenerated per-user on install
manifest.json          # Uploaded separately
openclaw.json          # Local OpenClaw config
auth-profiles.json     # Local auth credentials
.web42/                # Build artifact
.git/, node_modules/   # Standard exclusions`}
          </pre>
        </div>
        <p className="text-sm text-muted-foreground">
          You can add additional exclusions in a{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            .web42ignore
          </code>{" "}
          file at the root of your agent directory, one pattern per line.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How pack works</h2>
        <p className="text-muted-foreground">
          When you run{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            web42 pack
          </code>{" "}
          (or{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            web42 push
          </code>{" "}
          which auto-packs), the OpenClaw adapter performs these steps:
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-muted-foreground">
          <li>
            Collects all files from the current directory, excluding the
            hardcoded list above plus any patterns in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              .web42ignore
            </code>
          </li>
          <li>
            Sanitizes file contents — replaces absolute paths to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              ~/.openclaw
            </code>{" "}
            with{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {"{{OPENCLAW_HOME}}"}
            </code>{" "}
            template variables so they resolve correctly on any machine
          </li>
          <li>
            Extracts the agent&apos;s configuration from your local{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              openclaw.json
            </code>{" "}
            — agent entry, channel bindings, skill configs, and tool settings
            are bundled into a config template
          </li>
          <li>
            Strips secrets from skill configs and channel configs, replacing
            them with{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {"{{PLACEHOLDER}}"}
            </code>{" "}
            variables that become config variables in the manifest
          </li>
          <li>
            Outputs everything to the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              .web42/
            </code>{" "}
            directory, including a{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              .openclaw/config.json
            </code>{" "}
            with the config template
          </li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Use{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            web42 pack --dry-run
          </code>{" "}
          to preview the bundled output without writing files.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skills and config variables</h2>
        <p className="text-muted-foreground">
          Skills live in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            skills/&lt;name&gt;/SKILL.md
          </code>
          . They&apos;re auto-detected during init and pack — the name comes
          from the first markdown heading, the description from the body text.
        </p>
        <p className="text-muted-foreground">
          Config variables let each user provide their own API keys, tokens,
          and preferences. They come from two sources:
        </p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>
            Explicitly declared in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              manifest.json
            </code>{" "}
            under{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              configVariables
            </code>
          </li>
          <li>
            Auto-extracted during pack when secrets are stripped from skill and
            channel configs
          </li>
        </ul>
        <p className="text-muted-foreground">
          During install, the CLI prompts the user for each required variable.
          Values are stored locally in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            .web42.config.json
          </code>{" "}
          inside the workspace and never uploaded to the marketplace.
        </p>
        <p className="text-muted-foreground">Example in a manifest:</p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <pre>{`"configVariables": [
  {
    "key": "OPENAI_API_KEY",
    "label": "OpenAI API Key",
    "description": "Used for embeddings and completions",
    "required": true
  },
  {
    "key": "DISCORD_TOKEN",
    "label": "Discord Bot Token",
    "required": true
  }
]`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Installation flow</h2>
        <p className="text-muted-foreground">
          What happens when a user runs:
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          web42 openclaw install @username/agent-name
        </div>
        <ol className="list-decimal space-y-2 pl-6 text-muted-foreground">
          <li>
            <strong className="text-foreground">Access check</strong> — The CLI
            verifies the user has access to the agent (owner or free
            acquisition).
          </li>
          <li>
            <strong className="text-foreground">Fetch files</strong> — Downloads
            all agent files and the config template from the marketplace API.
          </li>
          <li>
            <strong className="text-foreground">Config prompts</strong> — If the
            agent has config variables, the CLI prompts for each one
            interactively. Use{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              --no-prompt
            </code>{" "}
            to use defaults instead.
          </li>
          <li>
            <strong className="text-foreground">Model API key</strong> — If the
            manifest specifies a{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              modelPreferences.primary
            </code>{" "}
            model and the provider API key isn&apos;t configured, the CLI
            prompts for it and saves it to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              ~/.openclaw/.env
            </code>
            .
          </li>
          <li>
            <strong className="text-foreground">Create workspace</strong> —
            Writes all agent files to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              ~/.openclaw/workspace-&lt;agent-name&gt;/
            </code>
            . Template variables like{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {"{{OPENCLAW_HOME}}"}
            </code>{" "}
            are resolved to actual paths. A fresh{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              USER.md
            </code>{" "}
            is generated.
          </li>
          <li>
            <strong className="text-foreground">Merge config</strong> — The
            config template is merged into{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              ~/.openclaw/openclaw.json
            </code>
            : the agent entry is added to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              agents.list
            </code>
            , channel bindings are appended, skill and tool configs are merged
            (existing entries are not overwritten), and config variable
            placeholders are replaced with the user&apos;s answers.
          </li>
          <li>
            <strong className="text-foreground">Save install metadata</strong>{" "}
            — A{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              .web42.config.json
            </code>{" "}
            file is written to the workspace with the source reference and all
            config answers.
          </li>
        </ol>
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-medium">Install options</p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
            <li>
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                --as &lt;name&gt;
              </code>{" "}
              — Install under a different local agent name
            </li>
            <li>
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                --no-prompt
              </code>{" "}
              — Skip interactive config prompts, use defaults
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Managing installed agents</h2>
        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-lg font-medium">List installed agents</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 openclaw list
            </div>
            <p className="text-muted-foreground">
              Shows all agents in your OpenClaw environment. Reads from{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                openclaw.json
              </code>{" "}
              first, falls back to scanning{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                workspace-*
              </code>{" "}
              directories.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">Update agents</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 openclaw update
            </div>
            <p className="text-muted-foreground">
              Updates all installed agents to their latest marketplace versions.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">Uninstall an agent</h3>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              web42 openclaw uninstall @username/agent-name
            </div>
            <p className="text-muted-foreground">
              Removes the agent&apos;s workspace directory and agent directory,
              then cleans up the agent entry and bindings from{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                openclaw.json
              </code>
              .
            </p>
          </section>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">File system layout</h2>
        <p className="text-muted-foreground">
          After installing an agent, the local OpenClaw directory looks like
          this:
        </p>
        <pre className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`~/.openclaw/
├── openclaw.json                    # Global config (agents, bindings, skills, channels)
├── .env                             # Provider API keys
├── workspace-my-agent/              # Agent workspace
│   ├── AGENTS.md
│   ├── IDENTITY.md
│   ├── SOUL.md
│   ├── TOOLS.md
│   ├── USER.md
│   ├── HEARTBEAT.md
│   ├── BOOTSTRAP.md
│   ├── .web42.config.json           # Install metadata + config answers
│   ├── skills/
│   │   └── ...
│   └── memory/                      # Created at runtime
│       └── YYYY-MM-DD.md
└── agents/
    └── my-agent/
        └── agent/                   # Agent directory referenced by openclaw.json`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Next steps</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link
              href="/docs/publishing"
              className="text-foreground underline underline-offset-4"
            >
              Publishing guide
            </Link>{" "}
            — manifest.json reference, pack/push workflow, managing your agent
          </li>
          <li>
            <Link
              href="/docs/cli"
              className="text-foreground underline underline-offset-4"
            >
              CLI reference
            </Link>{" "}
            — all commands and flags
          </li>
        </ul>
      </section>
    </div>
  )
}
