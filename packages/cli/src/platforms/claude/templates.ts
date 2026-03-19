/**
 * Scaffold templates for Claude Code agents.
 * Used by `web42 init` when platform is "claude".
 */

export function agentMdTemplate(
  name: string,
  description: string,
  skills: string[]
): string {
  const skillsList = skills.length > 0
    ? skills.map((s) => `  - ${s}`).join("\n")
    : "  # No skills detected"

  return `---
name: ${name}
description: ${description}
tools: Read, Grep, Glob, Bash
model: sonnet
skills:
${skillsList}
---

You are ${name}. ${description}

When invoked, analyze the task using your preloaded skills.
`
}
