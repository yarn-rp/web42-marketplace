import { describe, it, expect } from "vitest"
import { stripForbiddenFrontmatter } from "../security.js"

describe("stripForbiddenFrontmatter", () => {
  it("strips hooks from frontmatter", () => {
    const input = `---
name: test-agent
description: A test agent
hooks: some-hook-config
model: sonnet
---

Body content here.
`
    const { cleaned, stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toEqual(["hooks"])
    expect(cleaned).not.toContain("hooks")
    expect(cleaned).toContain("name: test-agent")
    expect(cleaned).toContain("model: sonnet")
    expect(cleaned).toContain("Body content here.")
  })

  it("strips mcpServers from frontmatter", () => {
    const input = `---
name: test-agent
mcpServers: some-server
---

Body.
`
    const { cleaned, stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toEqual(["mcpServers"])
    expect(cleaned).not.toContain("mcpServers")
    expect(cleaned).toContain("name: test-agent")
  })

  it("strips permissionMode from frontmatter", () => {
    const input = `---
name: test-agent
permissionMode: full
---

Body.
`
    const { cleaned, stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toEqual(["permissionMode"])
    expect(cleaned).not.toContain("permissionMode")
  })

  it("strips multiple forbidden keys at once", () => {
    const input = `---
name: test-agent
hooks: PostToolUse
mcpServers: my-server
permissionMode: full
model: sonnet
---

Body.
`
    const { cleaned, stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toContain("hooks")
    expect(stripped).toContain("mcpServers")
    expect(stripped).toContain("permissionMode")
    expect(stripped).toHaveLength(3)
    expect(cleaned).toContain("name: test-agent")
    expect(cleaned).toContain("model: sonnet")
    expect(cleaned).not.toContain("hooks")
    expect(cleaned).not.toContain("mcpServers")
    expect(cleaned).not.toContain("permissionMode")
  })

  it("preserves all safe frontmatter keys", () => {
    const input = `---
name: test-agent
description: A test agent
tools: Read, Grep, Glob, Bash
model: sonnet
---

Body.
`
    const { cleaned, stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toEqual([])
    expect(cleaned).toBe(input)
  })

  it("handles content with no frontmatter", () => {
    const input = "Just some markdown content.\nNo frontmatter here."
    const { cleaned, stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toEqual([])
    expect(cleaned).toBe(input)
  })

  it("handles empty frontmatter", () => {
    const input = `---
---

Body content.
`
    const { cleaned, stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toEqual([])
    expect(cleaned).toBe(input)
  })

  it("returns list of stripped keys", () => {
    const input = `---
name: test
hooks: something
mcpServers: something-else
---

Body.
`
    const { stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toEqual(["hooks", "mcpServers"])
  })

  it("preserves body content after frontmatter", () => {
    const input = `---
name: test
hooks: should-be-removed
---

# Main Heading

This is the body content.
It has multiple lines.

## Section 2

More content here.
`
    const { cleaned } = stripForbiddenFrontmatter(input)
    expect(cleaned).toContain("# Main Heading")
    expect(cleaned).toContain("This is the body content.")
    expect(cleaned).toContain("## Section 2")
    expect(cleaned).toContain("More content here.")
  })

  it("handles multiline frontmatter values (indented lines)", () => {
    const input = `---
name: test-agent
hooks:
  PostToolUse:
    - matcher: "Edit|Write"
  PreToolUse:
    - type: command
model: sonnet
skills:
  - skill-one
  - skill-two
---

Body.
`
    const { cleaned, stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toEqual(["hooks"])
    expect(cleaned).toContain("name: test-agent")
    expect(cleaned).toContain("model: sonnet")
    expect(cleaned).toContain("skills:")
    expect(cleaned).toContain("  - skill-one")
    expect(cleaned).not.toContain("PostToolUse")
    expect(cleaned).not.toContain("matcher")
  })

  it("handles malformed frontmatter (no closing ---)", () => {
    const input = `---
name: test
hooks: something
No closing delimiter
`
    const { cleaned, stripped } = stripForbiddenFrontmatter(input)
    expect(stripped).toEqual([])
    expect(cleaned).toBe(input)
  })
})
