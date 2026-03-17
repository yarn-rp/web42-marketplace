import {
  writeFileSync,
  mkdirSync,
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
import { listBundledSkills, copySkillToWorkspace } from "../utils/bundled-skills.js"
import { resolvePlatform, listPlatforms } from "../platforms/registry.js"
import { writeMarketplace, writeResourcesMeta } from "../utils/sync.js"
import { DEFAULT_MARKETPLACE } from "../types/sync.js"
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
          if (!parsed.internal) {
            skills.push({ name: parsed.name, description: parsed.description })
          }
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
  .option(
    "--with-skills [names...]",
    "Add bundled starter skills (omit names to install all)"
  )
  .action(async (opts: { withSkills?: boolean | string[] }) => {
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

    // Scaffold .web42/ metadata folder
    const web42Dir = join(cwd, ".web42")
    mkdirSync(web42Dir, { recursive: true })

    const marketplacePath = join(web42Dir, "marketplace.json")
    if (!existsSync(marketplacePath)) {
      writeMarketplace(cwd, { ...DEFAULT_MARKETPLACE })
      console.log(
        chalk.green(`  Created ${chalk.bold(".web42/marketplace.json")}`)
      )
    } else {
      console.log(
        chalk.dim("  Skipped .web42/marketplace.json (already exists)")
      )
    }

    const resourcesJsonPath = join(web42Dir, "resources.json")
    if (!existsSync(resourcesJsonPath)) {
      writeResourcesMeta(cwd, [])
      console.log(
        chalk.green(`  Created ${chalk.bold(".web42/resources.json")}`)
      )
    } else {
      console.log(
        chalk.dim("  Skipped .web42/resources.json (already exists)")
      )
    }

    mkdirSync(join(web42Dir, "resources"), { recursive: true })

    // Offer bundled starter skills
    const bundled = listBundledSkills()
    if (bundled.length > 0) {
      let skillsToInstall: string[] = []

      if (opts.withSkills === true) {
        skillsToInstall = bundled.map((s) => s.name)
      } else if (Array.isArray(opts.withSkills) && opts.withSkills.length > 0) {
        skillsToInstall = opts.withSkills.filter((name) =>
          bundled.some((s) => s.name === name)
        )
        const unknown = opts.withSkills.filter(
          (name) => !bundled.some((s) => s.name === name)
        )
        if (unknown.length > 0) {
          console.log(
            chalk.yellow(`  Unknown skill(s): ${unknown.join(", ")}`)
          )
        }
      } else if (!opts.withSkills) {
        console.log()
        const { selectedSkills } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "selectedSkills",
            message: "Add starter skills to your workspace?",
            choices: bundled.map((s) => ({
              name: `${s.name} — ${s.description}`,
              value: s.name,
              checked: false,
            })),
          },
        ])
        skillsToInstall = selectedSkills
      }

      if (skillsToInstall.length > 0) {
        const installed: string[] = []
        for (const name of skillsToInstall) {
          if (copySkillToWorkspace(name, cwd)) {
            installed.push(name)
          }
        }
        if (installed.length > 0) {
          console.log(
            chalk.green(`  Added starter skill(s): ${installed.join(", ")}`)
          )
        }
      }
    }

    console.log()
    console.log(
      chalk.dim(
        "Edit .web42/marketplace.json to set price, tags, license, and visibility."
      )
    )
    console.log(
      chalk.dim(
        "Run `web42 pack` to bundle your agent, or `web42 push` to pack and publish."
      )
    )
  })
