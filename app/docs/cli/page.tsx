export default function DocsCliPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">CLI Reference</h1>
        <p className="text-muted-foreground">
          The Web42 CLI is the primary tool for managing and publishing agent
          packages.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Installation</h2>
        <p className="mb-4 text-muted-foreground">
          [Placeholder: How to install the Web42 CLI.]
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <code>npm install -g web42</code>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Basic usage</h2>
        <p className="mb-4 text-muted-foreground">
          [Placeholder: Core commands for publishing, installing, and updating
          agents.]
        </p>
        <div className="space-y-2 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <div>
            <code>web42 push</code> — Publish agent
          </div>
          <div>
            <code>web42 install @owner/agent</code> — Install agent
          </div>
          <div>
            <code>web42 update</code> — Update installed agents
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Examples</h2>
        <p className="mb-4 text-muted-foreground">
          [Placeholder: Example workflows and common commands.]
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <code>web42 install @username/my-agent</code>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Configuration</h2>
        <p className="text-muted-foreground">
          [Placeholder: Environment variables, config files, and CLI options.]
        </p>
      </section>
    </div>
  )
}
