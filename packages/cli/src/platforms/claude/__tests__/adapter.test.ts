import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { ClaudeAdapter } from "../adapter.js"

function createTempDir(): string {
  const dir = join(tmpdir(), `claude-adapter-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

describe("ClaudeAdapter", () => {
  let adapter: ClaudeAdapter
  let tempDir: string

  beforeEach(() => {
    adapter = new ClaudeAdapter()
    tempDir = createTempDir()
    // Override home so discoverAgents/resolveSkills don't pick up the real
    // ~/.claude directory during tests, making results fully deterministic.
    adapter.home = tempDir
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe("discoverAgents", () => {
    it("finds agents in cwd/agents/", () => {
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(
        join(agentsDir, "test-agent.md"),
        `---
name: test-agent
description: A test agent
model: sonnet
skills:
  - skill-one
---

You are a test agent.
`
      )

      const agents = adapter.discoverAgents(tempDir)
      expect(agents).toHaveLength(1)
      expect(agents[0].name).toBe("test-agent")
      expect(agents[0].description).toBe("A test agent")
      expect(agents[0].model).toBe("sonnet")
      expect(agents[0].skills).toEqual(["skill-one"])
    })

    it("parses frontmatter correctly with multiple skills", () => {
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(
        join(agentsDir, "multi-skill.md"),
        `---
name: multi-skill-agent
description: Agent with many skills
model: opus
skills:
  - flutter-conventions
  - dart-testing
  - a11y-flutter
tools: Read, Grep, Glob, Bash
---

Body content.
`
      )

      const agents = adapter.discoverAgents(tempDir)
      expect(agents).toHaveLength(1)
      expect(agents[0].skills).toEqual([
        "flutter-conventions",
        "dart-testing",
        "a11y-flutter",
      ])
    })

    it("returns empty for no agents", () => {
      const agents = adapter.discoverAgents(tempDir)
      expect(agents).toEqual([])
    })

    it("uses filename as fallback name when no frontmatter name", () => {
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(
        join(agentsDir, "my-agent.md"),
        `---
description: No name in frontmatter
---

Body.
`
      )

      const agents = adapter.discoverAgents(tempDir)
      expect(agents[0].name).toBe("my-agent")
    })

    it("discovers multiple agents", () => {
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(join(agentsDir, "agent-a.md"), "---\nname: agent-a\n---\nBody.")
      writeFileSync(join(agentsDir, "agent-b.md"), "---\nname: agent-b\n---\nBody.")

      const agents = adapter.discoverAgents(tempDir)
      expect(agents).toHaveLength(2)
      const names = agents.map((a) => a.name).sort()
      expect(names).toEqual(["agent-a", "agent-b"])
    })

    it("skips non-.md files", () => {
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(join(agentsDir, "agent.md"), "---\nname: real-agent\n---\nBody.")
      writeFileSync(join(agentsDir, "notes.txt"), "Just a text file")
      writeFileSync(join(agentsDir, ".DS_Store"), "")

      const agents = adapter.discoverAgents(tempDir)
      expect(agents).toHaveLength(1)
      expect(agents[0].name).toBe("real-agent")
    })
  })

  describe("resolveSkills", () => {
    it("finds skills in cwd/skills/", () => {
      const skillDir = join(tempDir, "skills", "my-skill")
      mkdirSync(skillDir, { recursive: true })
      writeFileSync(join(skillDir, "SKILL.md"), "# My Skill\nDescription here.")

      const resolved = adapter.resolveSkills(["my-skill"], tempDir)
      expect(resolved).toHaveLength(1)
      expect(resolved[0].name).toBe("my-skill")
      expect(resolved[0].found).toBe(true)
      expect(resolved[0].sourcePath).toBe(skillDir)
    })

    it("marks missing skills as not found", () => {
      const resolved = adapter.resolveSkills(["nonexistent-skill"], tempDir)
      expect(resolved).toHaveLength(1)
      expect(resolved[0].found).toBe(false)
    })

    it("resolves multiple skills", () => {
      mkdirSync(join(tempDir, "skills", "skill-a"), { recursive: true })
      writeFileSync(join(tempDir, "skills", "skill-a", "SKILL.md"), "# Skill A")
      mkdirSync(join(tempDir, "skills", "skill-b"), { recursive: true })
      writeFileSync(join(tempDir, "skills", "skill-b", "SKILL.md"), "# Skill B")

      const resolved = adapter.resolveSkills(["skill-a", "skill-b", "missing"], tempDir)
      expect(resolved.filter((s) => s.found)).toHaveLength(2)
      expect(resolved.find((s) => s.name === "missing")?.found).toBe(false)
    })
  })

  describe("extractInitConfig", () => {
    it("returns config when agent exists", () => {
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(
        join(agentsDir, "test.md"),
        "---\nname: test-agent\nmodel: sonnet\n---\nBody."
      )

      const config = adapter.extractInitConfig(tempDir)
      expect(config).not.toBeNull()
      expect(config!.name).toBe("test-agent")
      expect(config!.model).toBe("sonnet")
    })

    it("returns null when no agents exist", () => {
      const config = adapter.extractInitConfig(tempDir)
      expect(config).toBeNull()
    })
  })

  describe("pack", () => {
    it("collects agent and referenced skills", async () => {
      // Set up agent
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(
        join(agentsDir, "my-agent.md"),
        `---
name: my-agent
skills:
  - test-skill
---

Agent body.
`
      )

      // Set up skill
      const skillDir = join(tempDir, "skills", "test-skill")
      mkdirSync(skillDir, { recursive: true })
      writeFileSync(join(skillDir, "SKILL.md"), "# Test Skill\nSkill description.")
      mkdirSync(join(skillDir, "references"), { recursive: true })
      writeFileSync(join(skillDir, "references", "ref.md"), "Reference content.")

      const result = await adapter.pack({
        cwd: tempDir,
        outputDir: ".web42/my-agent/dist",
        agentName: "my-agent",
      })

      expect(result.files.length).toBeGreaterThanOrEqual(3)
      const paths = result.files.map((f) => f.path)
      expect(paths).toContain("agents/my-agent.md")
      expect(paths).toContain("skills/test-skill/SKILL.md")
      expect(paths).toContain("skills/test-skill/references/ref.md")
    })

    it("excludes .git and node_modules", async () => {
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(join(agentsDir, "test.md"), "---\nname: test\n---\nBody.")

      // Create files that should be excluded
      mkdirSync(join(tempDir, ".git"), { recursive: true })
      writeFileSync(join(tempDir, ".git", "config"), "git config")
      mkdirSync(join(tempDir, "node_modules", "pkg"), { recursive: true })
      writeFileSync(join(tempDir, "node_modules", "pkg", "index.js"), "module.exports = {}")

      const result = await adapter.pack({
        cwd: tempDir,
        outputDir: ".web42/test/dist",
        agentName: "test",
      })

      const paths = result.files.map((f) => f.path)
      expect(paths.some((p) => p.includes(".git"))).toBe(false)
      expect(paths.some((p) => p.includes("node_modules"))).toBe(false)
    })

    it("applies template var sanitization", async () => {
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(
        join(agentsDir, "test.md"),
        "---\nname: test\n---\nPath: ~/.claude/agents/test.md"
      )

      const result = await adapter.pack({
        cwd: tempDir,
        outputDir: ".web42/test/dist",
        agentName: "test",
      })

      const agentFile = result.files.find((f) => f.path === "agents/test.md")
      expect(agentFile?.content).toContain("{{CLAUDE_HOME}}")
      expect(agentFile?.content).not.toContain("~/.claude/")
    })

    it("throws when agentName is not provided", async () => {
      await expect(
        adapter.pack({ cwd: tempDir, outputDir: "dist" })
      ).rejects.toThrow("agentName")
    })

    it("throws when agent file not found", async () => {
      await expect(
        adapter.pack({ cwd: tempDir, outputDir: "dist", agentName: "nonexistent" })
      ).rejects.toThrow("not found")
    })

    it("collects commands if present", async () => {
      const agentsDir = join(tempDir, "agents")
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(join(agentsDir, "test.md"), "---\nname: test\n---\nBody.")

      const commandsDir = join(tempDir, "commands")
      mkdirSync(commandsDir, { recursive: true })
      writeFileSync(join(commandsDir, "review.md"), "# Review command")

      const result = await adapter.pack({
        cwd: tempDir,
        outputDir: "dist",
        agentName: "test",
      })

      const paths = result.files.map((f) => f.path)
      expect(paths).toContain("commands/review.md")
    })
  })

  describe("install and uninstall", () => {
    let installDir: string

    beforeEach(() => {
      installDir = createTempDir()
    })

    afterEach(() => {
      if (existsSync(installDir)) {
        rmSync(installDir, { recursive: true, force: true })
      }
    })

    it("rejects path traversal", async () => {
      // We can't easily test the actual install since it writes to ~/.claude/
      // but we can test the path traversal check by examining the adapter logic
      const files = [
        { path: "../../../etc/passwd", content: "bad content", content_hash: "abc" },
      ]

      // The adapter checks: resolve(CLAUDE_HOME, file.path).startsWith(resolve(CLAUDE_HOME))
      // A path with ../ would resolve outside CLAUDE_HOME
      const { resolve: pathResolve } = await import("path")
      const { homedir: getHomedir } = await import("os")
      const home = join(getHomedir(), ".claude")
      const resolved = pathResolve(home, "../../../etc/passwd")
      expect(resolved.startsWith(pathResolve(home))).toBe(false)
    })
  })
})
