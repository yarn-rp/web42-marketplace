import { writeFileSync, existsSync, readdirSync } from "fs"
import { join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import inquirer from "inquirer"

import { requireAuth } from "../utils/config.js"
import {
  AGENTS_MD,
  IDENTITY_MD,
  SOUL_MD,
  TOOLS_MD,
  USER_MD,
  HEARTBEAT_MD,
  INIT_BOOTSTRAP_MD,
} from "../platforms/openclaw/templates.js"

function detectWorkspaceSkills(cwd: string): string[] {
  const skillsDir = join(cwd, "skills")
  if (!existsSync(skillsDir)) return []

  const skills: string[] = []
  try {
    const entries = readdirSync(skillsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillMd = join(skillsDir, entry.name, "SKILL.md")
        if (existsSync(skillMd)) {
          skills.push(entry.name)
        }
      }
    }
  } catch {
    // ignore read errors
  }
  return skills.sort()
}

const CATEGORIES = [
  "Customer Support",
  "Healthcare",
  "Developer Tools",
  "Personal Assistant",
  "Sales",
  "Marketing",
  "Education",
  "Finance",
  "Content Creation",
  "Productivity",
]

export const initCommand = new Command("init")
  .description("Create a manifest.json for your agent package")
  .action(async () => {
    const config = requireAuth()
    const cwd = process.cwd()
    const manifestPath = join(cwd, "manifest.json")

    if (existsSync(manifestPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: "manifest.json already exists. Overwrite?",
          default: false,
        },
      ])
      if (!overwrite) {
        console.log(chalk.yellow("Aborted."))
        return
      }
    }

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "platform",
        message: "Platform:",
        choices: ["openclaw"],
        default: "openclaw",
      },
      {
        type: "input",
        name: "name",
        message: "Agent name (lowercase, hyphens allowed):",
        validate: (val: string) =>
          /^[a-z0-9][a-z0-9-]*$/.test(val) ||
          "Must be lowercase alphanumeric with hyphens",
      },
      {
        type: "input",
        name: "description",
        message: "Short description:",
        validate: (val: string) =>
          val.length > 0 && val.length <= 500 || "1-500 characters",
      },
      {
        type: "input",
        name: "version",
        message: "Version:",
        default: "1.0.0",
        validate: (val: string) =>
          /^\d+\.\d+\.\d+$/.test(val) || "Must follow semver (e.g. 1.0.0)",
      },
      {
        type: "list",
        name: "category",
        message: "Primary category:",
        choices: CATEGORIES,
      },
      {
        type: "input",
        name: "tags",
        message: "Tags (comma-separated):",
        filter: (val: string) =>
          val
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
      },
      {
        type: "input",
        name: "channels",
        message: "Supported channels (comma-separated, e.g. discord,slack,web):",
        filter: (val: string) =>
          val
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
      },
      {
        type: "input",
        name: "primaryModel",
        message: "Primary model preference (e.g. claude-sonnet-4-20250514):",
        default: "",
      },
      {
        type: "input",
        name: "demoVideoUrl",
        message: "Demo video URL (optional):",
        default: "",
      },
    ])

    const detectedSkills = detectWorkspaceSkills(cwd)
    if (detectedSkills.length > 0) {
      console.log(
        chalk.dim(
          `  Detected ${detectedSkills.length} skill(s): ${detectedSkills.join(", ")}`
        )
      )
    }

    const manifest = {
      format: "agentpkg/1",
      platform: answers.platform,
      name: answers.name,
      description: answers.description,
      version: answers.version,
      author: config.username,
      channels: answers.channels,
      skills: detectedSkills,
      plugins: [] as string[],
      modelPreferences: answers.primaryModel
        ? { primary: answers.primaryModel }
        : undefined,
      tags: answers.tags,
      demoVideoUrl: answers.demoVideoUrl || undefined,
      configVariables: [] as Array<{
        key: string
        label: string
        required: boolean
      }>,
    }

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
    console.log()
    console.log(chalk.green(`Created ${chalk.bold("manifest.json")}`))

    const scaffoldFiles: Array<{
      name: string
      content: string
      alwaysWrite: boolean
    }> = [
      { name: "AGENTS.md", content: AGENTS_MD, alwaysWrite: false },
      { name: "IDENTITY.md", content: IDENTITY_MD, alwaysWrite: false },
      { name: "SOUL.md", content: SOUL_MD, alwaysWrite: false },
      { name: "TOOLS.md", content: TOOLS_MD, alwaysWrite: false },
      { name: "HEARTBEAT.md", content: HEARTBEAT_MD, alwaysWrite: false },
      { name: "BOOTSTRAP.md", content: INIT_BOOTSTRAP_MD, alwaysWrite: false },
      { name: "USER.md", content: USER_MD, alwaysWrite: true },
    ]

    const created: string[] = []
    const skipped: string[] = []

    for (const file of scaffoldFiles) {
      const filePath = join(cwd, file.name)
      if (!file.alwaysWrite && existsSync(filePath)) {
        skipped.push(file.name)
        continue
      }
      writeFileSync(filePath, file.content, "utf-8")
      created.push(file.name)
    }

    if (created.length > 0) {
      console.log(
        chalk.green(`  Scaffolded: ${created.join(", ")}`)
      )
    }
    if (skipped.length > 0) {
      console.log(
        chalk.dim(`  Skipped (already exist): ${skipped.join(", ")}`)
      )
    }

    console.log()
    console.log(
      chalk.dim(
        "Run `web42 pack` to bundle your agent, or `web42 push` to pack and publish."
      )
    )
  })
