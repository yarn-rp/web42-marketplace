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
        <p className="text-muted-foreground">
          [Placeholder: Describe Web42 as a marketplace for engineers to publish
          their agentic solutions and earn from their work.]
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Getting started</h2>
        <p className="mb-4 text-muted-foreground">
          [Placeholder: Quick start guide for installing the CLI and publishing
          your first agent.]
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <code>web42 add @username/agent-name</code>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">How agents are ranked</h2>
        <p className="text-muted-foreground">
          [Placeholder: Explain ranking criteria, install counts, stars, and
          discoverability.]
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Browse the marketplace</h2>
        <p className="text-muted-foreground">
          [Placeholder: How to explore agents, filter by category, and find
          solutions.]
        </p>
      </section>
    </div>
  )
}
