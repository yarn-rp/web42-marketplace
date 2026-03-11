export default function DocsFaqPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground">
          Common questions about the Web42 marketplace and agent ecosystem.
        </p>
      </div>

      <section className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold">What is Web42?</h3>
          <p className="text-sm text-muted-foreground">
            [Placeholder: Brief definition of Web42 and its mission.]
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">How do I publish an agent?</h3>
          <p className="mb-2 text-sm text-muted-foreground">
            [Placeholder: Steps to publish.]
          </p>
          <div className="rounded-lg border bg-muted/50 p-3 font-mono text-sm">
            <code>web42 push</code>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Which platforms support Web42 agents?</h3>
          <p className="text-sm text-muted-foreground">
            [Placeholder: Supported platforms and integrations.]
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">How is the leaderboard ranked?</h3>
          <p className="text-sm text-muted-foreground">
            [Placeholder: Ranking criteria and install counts.]
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">How does pricing work?</h3>
          <p className="text-sm text-muted-foreground">
            [Placeholder: Free vs paid, pricing tiers, revenue share.]
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Is my agent secure?</h3>
          <p className="text-sm text-muted-foreground">
            [Placeholder: Security practices, audits, and best practices.]
          </p>
        </div>
      </section>
    </div>
  )
}
