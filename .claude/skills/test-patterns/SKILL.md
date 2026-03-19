---
name: test-patterns
description: Testing patterns for Next.js API routes, React components, and CLI commands
---

# Test Patterns

## API Route Tests
```typescript
import { POST } from "@/app/api/agents/route"
import { createMockRequest } from "@/test/helpers"

describe("POST /api/agents", () => {
  it("requires authentication", async () => {
    const req = createMockRequest({ method: "POST", body: {} })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("validates request body", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { invalid: true },
      authenticated: true,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

## Component Tests
```typescript
import { render, screen } from "@testing-library/react"
import { AgentCard } from "@/components/agent-card"

describe("AgentCard", () => {
  it("displays price in dollars", () => {
    render(<AgentCard agent={{ price_cents: 999, name: "Test" }} />)
    expect(screen.getByText("$9.99")).toBeInTheDocument()
  })

  it("shows Free for zero price", () => {
    render(<AgentCard agent={{ price_cents: 0, name: "Test" }} />)
    expect(screen.getByText("Free")).toBeInTheDocument()
  })
})
```

## CLI Tests
- Create temp directories with `mkdtemp` for isolation
- Mock `homedir()` to avoid touching real `~/.claude/`
- Always clean up temp dirs in `afterEach`
- Test both success and error paths for every command
- Verify pack results have SHA-256 content hashes
- Check security filtering strips forbidden frontmatter on install
- Test conflict detection with pre-existing files

## Test Conventions
- One assertion per test when possible
- Descriptive test names: "it should [expected behavior] when [condition]"
- Arrange-Act-Assert pattern
- No hardcoded timeouts — use `waitFor` or `vi.useFakeTimers()`
- Integration tests hit real database, unit tests use mocks
