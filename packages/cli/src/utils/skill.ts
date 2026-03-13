export function parseSkillMd(
  content: string,
  fallbackName: string
): { name: string; description: string } {
  const lines = content.split("\n")
  let name = fallbackName
  const descriptionLines: string[] = []

  let i = 0
  for (; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^#\s+(.+)/)
    if (headingMatch) {
      name = headingMatch[1].trim()
      i++
      break
    }
  }
  for (; i < lines.length; i++) {
    if (lines[i].match(/^#/)) break
    descriptionLines.push(lines[i])
  }
  const description = descriptionLines.join("\n").trim()
  return { name, description: description || `Skill: ${fallbackName}` }
}
