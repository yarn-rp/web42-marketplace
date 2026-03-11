export default function DocsPublishingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Publishing Guide</h1>
        <p className="text-muted-foreground">
          How to create and publish your agent packages on Web42.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Creating an agent</h2>
        <p className="text-muted-foreground">
          [Placeholder: Steps to create your agent, define its capabilities, and
          prepare it for publishing.]
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Agent file structure</h2>
        <p className="mb-4 text-muted-foreground">
          [Placeholder: Required files and structure for a valid agent package.]
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <pre>
            {`agent/
├── manifest.json
├── README.md
└── ...`}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Publishing workflow</h2>
        <p className="text-muted-foreground">
          [Placeholder: Workflow from local development to publish, including
          CLI commands and preview.]
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Versioning</h2>
        <p className="text-muted-foreground">
          [Placeholder: How versioning works, semantic versioning, and updating
          published agents.]
        </p>
      </section>
    </div>
  )
}
