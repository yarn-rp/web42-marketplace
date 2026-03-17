import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"

import { parseSkillMd } from "./skill.js"
import { EMBEDDED_SKILLS } from "../generated/embedded-skills.js"

export interface BundledSkill {
  name: string
  description: string
}

export function listBundledSkills(): BundledSkill[] {
  const skills: BundledSkill[] = []
  for (const skill of EMBEDDED_SKILLS) {
    const skillMdFile = skill.files.find((f) => f.path === "SKILL.md")
    if (!skillMdFile) continue

    const parsed = parseSkillMd(skillMdFile.content, skill.name)
    skills.push({ name: parsed.name, description: parsed.description })
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

export function copySkillToWorkspace(skillName: string, cwd: string): boolean {
  const skill = EMBEDDED_SKILLS.find((s) => s.name === skillName)
  if (!skill) return false

  const targetDir = join(cwd, "skills", skillName)

  for (const file of skill.files) {
    if (file.path === "_meta.json") continue
    const filePath = join(targetDir, file.path)
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, file.content, "utf-8")
  }

  return true
}
