import {
  writeFileSync,
  existsSync,
  readdirSync,
  readFileSync,
} from "fs"
import { join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import inquirer from "inquirer"

import { requireAuth } from "../utils/config.js"
import { parseSkillMd } from "../utils/skill.js"
import { resolvePlatform, listPlatforms } from "../platforms/registry.js"
import {
  AGENTS_MD,
  IDENTITY_MD,
  SOUL_MD,
  TOOLS_MD,
  USER_MD,
  HEARTBEAT_MD,
  INIT_BOOTSTRAP_MD,
} from "../platforms/openclaw/templates.js"

function detectWorkspaceSkills(
  cwd: string
): Array<{ name: string; description: string }> {
  const skillsDir = join(cwd, "skills")
  if (!existsSync(skillsDir)) return []

  const skills: Array<{ name: string; description: string }> = []
  try {
    const entries = readdirSync(skillsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillMd = join(skillsDir, entry.name, "SKILL.md")
        if (existsSync(skillMd)) {
          const content = readFileSync(skillMd, "utf-8")
          const parsed = parseSkillMd(content, entry.name)
          skills.push(parsed)
        }
      }
    }
  } catch {
    // ignore read errors
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

export const initCommand = new Command("init")
  .description("Create a manifest.json for your agent package")
  .action(async () => {
    const config = requireAuth()
    const cwd = process.cwd()
    const manifestPath = join(cwd, "manifest.json")

    let existingManifest: Record<string, unknown> | null = null
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
      try {
        existingManifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
      } catch {
        // ignore parse errors from existing manifest
      }
    }

    const platforms = listPlatforms()
    const { platform } = await inquirer.prompt([
      {
        type: "list",
        name: "platform",
        message: "Platform:",
        choices: platforms,
        default: platforms[0],
      },
    ])

    const adapter = resolvePlatform(platform)
    const initConfig = adapter.extractInitConfig(cwd)

    if (!initConfig) {
      console.log(
        chalk.red(
          `No agent entry found in ${adapter.name} config for this directory.\n` +
          `Set up your agent in ${adapter.name} first.`
        )
      )
      process.exit(1)
    }

    console.log()
    console.log(chalk.dim(`  Agent: ${chalk.bold(initConfig.name)} (from ${adapter.name} config)`))
    if (initConfig.model) {
      console.log(chalk.dim(`  Model: ${initConfig.model}`))
    }
    console.log()

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "description",
        message: "Short description:",
        default: (existingManifest?.description as string) ?? "",
        validate: (val: string) =>
          (val.length > 0 && val.length <= 500) || "1-500 characters",
      },
      {
        type: "input",
        name: "version",
        message: "Version:",
        default: (existingManifest?.version as string) ?? "1.0.0",
        validate: (val: string) =>
          /^\d+\.\d+\.\d+$/.test(val) || "Must follow semver (e.g. 1.0.0)",
      },
    ])

    const detectedSkills = detectWorkspaceSkills(cwd)
    if (detectedSkills.length > 0) {
      console.log(
        chalk.dim(
          `  Detected ${detectedSkills.length} skill(s): ${detectedSkills.map((s) => s.name).join(", ")}`
        )
      )
    }

    const manifest = {
      format: "agentpkg/1",
      platform,
      name: initConfig.name,
      description: answers.description,
      version: answers.version,
      author: config.username,
      skills: detectedSkills,
      plugins: [] as string[],
      modelPreferences: initConfig.model
        ? { primary: initConfig.model }
        : undefined,
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
