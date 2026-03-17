import { existsSync, readdirSync, readFileSync, mkdirSync, cpSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

import { parseSkillMd } from "./skill.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BUNDLED_SKILLS_DIR = join(__dirname, "..", "..", "skills")

export interface BundledSkill {
  name: string
  description: string
  sourcePath: string
}

export function listBundledSkills(): BundledSkill[] {
  if (!existsSync(BUNDLED_SKILLS_DIR)) return []

  const skills: BundledSkill[] = []
  try {
    const entries = readdirSync(BUNDLED_SKILLS_DIR, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const skillMdPath = join(BUNDLED_SKILLS_DIR, entry.name, "SKILL.md")
      if (!existsSync(skillMdPath)) continue

      const content = readFileSync(skillMdPath, "utf-8")
      const parsed = parseSkillMd(content, entry.name)
      skills.push({
        name: parsed.name,
        description: parsed.description,
        sourcePath: join(BUNDLED_SKILLS_DIR, entry.name),
      })
    }
  } catch {
    // Bundled skills directory missing or unreadable
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

export function copySkillToWorkspace(skillName: string, cwd: string): boolean {
  const sourcePath = join(BUNDLED_SKILLS_DIR, skillName)
  if (!existsSync(sourcePath)) return false

  const targetPath = join(cwd, "skills", skillName)
  mkdirSync(targetPath, { recursive: true })

  cpSync(sourcePath, targetPath, {
    recursive: true,
    filter: (src) => !src.endsWith("_meta.json"),
  })

  return true
}
