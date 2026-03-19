/**
 * Security filtering for Claude Code agent .md files.
 *
 * Plugin subagents do not support hooks, mcpServers, or permissionMode.
 * These keys are stripped from frontmatter on install to prevent
 * marketplace-distributed agents from modifying the buyer's security posture.
 */

const FORBIDDEN_FRONTMATTER_KEYS = new Set([
  "hooks",
  "mcpServers",
  "permissionMode",
])

/**
 * Strip forbidden frontmatter keys from a Claude agent .md file.
 * Returns the cleaned content and a list of keys that were removed.
 */
export function stripForbiddenFrontmatter(content: string): {
  cleaned: string
  stripped: string[]
} {
  const lines = content.split("\n")

  // No frontmatter — return as-is
  if (lines[0]?.trim() !== "---") {
    return { cleaned: content, stripped: [] }
  }

  // Find the closing ---
  let closingIndex = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      closingIndex = i
      break
    }
  }

  // Malformed frontmatter (no closing ---) — return as-is
  if (closingIndex === -1) {
    return { cleaned: content, stripped: [] }
  }

  const stripped: string[] = []
  const filteredFrontmatterLines: string[] = []
  let skipUntilNextKey = false

  for (let i = 1; i < closingIndex; i++) {
    const line = lines[i]

    // Check if this is a top-level key (not indented, has colon)
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:/)
    if (keyMatch) {
      const key = keyMatch[1]
      if (FORBIDDEN_FRONTMATTER_KEYS.has(key)) {
        stripped.push(key)
        skipUntilNextKey = true
        continue
      }
      skipUntilNextKey = false
    }

    // If we're skipping a forbidden key's multiline value (indented lines)
    if (skipUntilNextKey) {
      // Indented lines or continuation lines belong to the forbidden key
      if (line.match(/^\s+/) || line.trim() === "") {
        continue
      }
      // Non-indented non-empty line = new key
      skipUntilNextKey = false
    }

    filteredFrontmatterLines.push(line)
  }

  // Reconstruct the file
  const before = lines[0] // opening ---
  const after = lines.slice(closingIndex) // closing --- + body

  const result = [before, ...filteredFrontmatterLines, ...after].join("\n")
  return { cleaned: result, stripped }
}
