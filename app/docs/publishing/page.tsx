import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Publishing Guide",
  description:
    "How to create, publish, and manage AI agent packages on the Web42 marketplace.",
}

export default function DocsPublishingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Publishing Guide</h1>
        <p className="text-muted-foreground">
          How to create, publish, and manage agent packages on Web42.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Creating an agent</h2>
        <p className="text-muted-foreground">
          Make sure you&apos;re authenticated first:
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          web42 auth login
        </div>
        <p className="text-muted-foreground">
          Then scaffold a new agent project:
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          web42 init
        </div>
        <p className="text-muted-foreground">
          The interactive prompts will ask for:
        </p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>
            <strong className="text-foreground">Platform</strong> — currently
            only <code>openclaw</code>
          </li>
          <li>
            <strong className="text-foreground">Agent name</strong> — lowercase
            alphanumeric with hyphens, must start with a letter or number
          </li>
          <li>
            <strong className="text-foreground">Description</strong> — 1–500
            characters
          </li>
          <li>
            <strong className="text-foreground">Version</strong> — semver
            format (e.g., <code>1.0.0</code>)
          </li>
          <li>
            <strong className="text-foreground">Primary category</strong> —
            Customer Support, Healthcare, Developer Tools, Personal Assistant,
            Sales, Marketing, Education, Finance, Content Creation, or
            Productivity
          </li>
          <li>
            <strong className="text-foreground">Tags</strong> — comma-separated
          </li>
          <li>
            <strong className="text-foreground">
              Primary model preference
            </strong>{" "}
            — e.g., <code>claude-sonnet-4-20250514</code>
          </li>
          <li>
            <strong className="text-foreground">Demo video URL</strong> —
            optional
          </li>
        </ul>
        <p className="text-muted-foreground">
          This creates a <code>manifest.json</code> and scaffolds the
          platform-specific files. Any skills found in{" "}
          <code>skills/*/SKILL.md</code> are auto-detected and added to the
          manifest. See the{" "}
          <Link
            href="/docs/platforms/openclaw"
            className="text-foreground underline underline-offset-4"
          >
            OpenClaw platform guide
          </Link>{" "}
          for details on each scaffolded file.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">manifest.json reference</h2>
        <p className="text-muted-foreground">
          The manifest describes your agent package. All fields:
        </p>
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              format{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Always <code>&quot;agentpkg/1&quot;</code>.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              platform{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string, optional)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Target platform, e.g., <code>&quot;openclaw&quot;</code>.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              name{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Lowercase alphanumeric with hyphens. 1–100 characters.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              description{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              1–500 characters.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              version{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Semver, e.g., <code>&quot;1.0.0&quot;</code>.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              author{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your Web42 username. Set automatically on push.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              skills{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (array)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <code>
                {"[{ name: string, description: string }]"}
              </code>{" "}
              — auto-detected from <code>skills/*/SKILL.md</code>.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              plugins{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string array)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Reserved for future use.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              modelPreferences{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (object, optional)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <code>{"{ primary?: string, fallback?: string }"}</code>
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              tags{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string array)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Searchable tags for discoverability.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              coverImage{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string, optional)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Path to a cover image file.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              demoVideoUrl{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (string, optional)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              URL to a demo video.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="font-mono text-sm font-semibold">
              configVariables{" "}
              <span className="font-sans font-normal text-muted-foreground">
                (array)
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <code>
                {"[{ key, label, description?, required, default? }]"}
              </code>{" "}
              — prompted during install.
            </p>
          </div>
        </div>

        <p className="pt-2 text-muted-foreground">Example manifest:</p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <pre>{`{
  "format": "agentpkg/1",
  "platform": "openclaw",
  "name": "my-support-agent",
  "description": "An AI customer support agent with knowledge base integration",
  "version": "1.0.0",
  "author": "yourname",
  "skills": [
    { "name": "knowledge-base", "description": "Query and retrieve from knowledge base" }
  ],
  "plugins": [],
  "modelPreferences": { "primary": "claude-sonnet-4-20250514" },
  "tags": ["support", "knowledge-base"],
  "configVariables": [
    { "key": "KB_API_KEY", "label": "Knowledge Base API Key", "required": true }
  ]
}`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skills</h2>
        <p className="text-muted-foreground">
          Skills are self-contained capabilities defined in{" "}
          <code>skills/&lt;name&gt;/SKILL.md</code>. They are auto-detected
          during <code>web42 init</code> and <code>web42 pack</code>.
        </p>
        <p className="text-muted-foreground">
          The skill name is parsed from the first markdown heading, and the
          description from the body text. Skills can reference config variables
          such as API keys or tokens.
        </p>
        <p className="text-muted-foreground">
          During pack, secrets are automatically stripped from skill files and
          replaced with placeholders. Buyers provide their own values when they
          install the agent.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pack and push</h2>

        <h3 className="text-lg font-medium">web42 pack</h3>
        <p className="text-muted-foreground">
          Bundles your agent into a <code>.web42/</code> directory. This strips
          secrets from skill files, merges config variables into the manifest,
          and prepares the artifact for upload.
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          web42 pack --dry-run
        </div>
        <p className="text-sm text-muted-foreground">
          Use <code>--dry-run</code> to preview the output without writing
          files.
        </p>

        <h3 className="pt-2 text-lg font-medium">web42 push</h3>
        <p className="text-muted-foreground">
          Uploads your agent to the marketplace. If no <code>.web42/</code>{" "}
          directory exists, it auto-packs first. After push, the agent is
          created as <strong>private</strong> by default.
        </p>

        <p className="pt-2 text-muted-foreground">Typical flow:</p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <pre>{`web42 init     # scaffold your agent
web42 push     # pack is implicit — packs and uploads`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Managing your agent</h2>
        <p className="text-muted-foreground">
          After pushing, visit your agent&apos;s detail page on the
          marketplace. The <strong>Settings</strong> and{" "}
          <strong>Marketplace</strong> tabs give you access to:
        </p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>
            <strong className="text-foreground">README</strong> — edit with the
            built-in markdown editor
          </li>
          <li>
            <strong className="text-foreground">Profile image</strong> — upload
            a profile image for your agent
          </li>
          <li>
            <strong className="text-foreground">License</strong> — set a
            license for your agent
          </li>
          <li>
            <strong className="text-foreground">Tags</strong> — add or remove
            tags for discoverability
          </li>
          <li>
            <strong className="text-foreground">Resources</strong> — attach
            demo videos, images, or documents (with sort order)
          </li>
          <li>
            <strong className="text-foreground">Pricing</strong> — set your
            agent as free or paid (minimum $5 for paid agents). See the{" "}
            <Link
              href="/docs/monetization"
              className="text-foreground underline underline-offset-4"
            >
              monetization guide
            </Link>
          </li>
          <li>
            <strong className="text-foreground">Visibility</strong> — toggle
            between public, private, or unlisted
          </li>
          <li>
            <strong className="text-foreground">Publish / Unpublish</strong> —
            publish when ready (validation must pass), or unpublish to hide
          </li>
          <li>
            <strong className="text-foreground">Delete</strong> — permanently
            remove your agent
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Versioning</h2>
        <p className="text-muted-foreground">
          Use semantic versioning in your <code>manifest.json</code>. Each{" "}
          <code>web42 push</code> updates the agent with the new version.
          Version history is tracked on the marketplace.
        </p>
        <p className="text-muted-foreground">
          To fetch the latest published files back to your local directory:
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          web42 pull
        </div>
      </section>
    </div>
  )
}
