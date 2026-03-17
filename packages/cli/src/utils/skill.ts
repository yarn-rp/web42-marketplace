export interface ParsedSkill {
  name: string
  description: string
  internal: boolean
}

function parseFrontmatter(lines: string[]): {
  frontmatter: Record<string, string>
  bodyStartIndex: number
} {
  const frontmatter: Record<string, string> = {}
  if (lines[0]?.trim() !== "---") return { frontmatter, bodyStartIndex: 0 }

  let i = 1
  for (; i < lines.length; i++) {
    if (lines[i].trim() === "---") return { frontmatter, bodyStartIndex: i + 1 }
    const match = lines[i].match(/^(\w+)\s*:\s*(.*)$/)
    if (match) {
      const val = match[2].trim().replace(/^["']|["']$/g, "")
      frontmatter[match[1]] = val
    }
  }
  return { frontmatter, bodyStartIndex: 0 }
}

export function parseSkillMd(
  content: string,
  fallbackName: string
): ParsedSkill {
  const lines = content.split("\n")
  const { frontmatter, bodyStartIndex } = parseFrontmatter(lines)

  let name = frontmatter.name || fallbackName
  const internal = frontmatter.internal === "true"
  const descriptionLines: string[] = []

  let i = bodyStartIndex
  for (; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^#\s+(.+)/)
    if (headingMatch) {
      if (!frontmatter.name) name = headingMatch[1].trim()
      i++
      break
    }
  }
  for (; i < lines.length; i++) {
    if (lines[i].match(/^#/)) break
    descriptionLines.push(lines[i])
  }

  const description =
    frontmatter.description ||
    descriptionLines.join("\n").trim() ||
    `Skill: ${fallbackName}`

  return { name, description, internal }
}
