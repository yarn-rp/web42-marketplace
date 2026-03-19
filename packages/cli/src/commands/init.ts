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

const WEB42_IGNORE_CONTENT = [
  "# .web42ignore — files excluded from web42 pack / push",
  "# Syntax: glob patterns, one per line. Lines starting with # are comments.",
  "# NOTE: .git, node_modules, .web42/, manifest.json, and other internals",
  "#       are always excluded automatically.",
  "",
  "# Working notes & drafts",
  "TODO.md",
  "NOTES.md",
  "drafts/**",
  "",
  "# Environment & secrets",
  ".env",
  ".env.*",
  "",
  "# IDE / editor",
  ".vscode/**",
  ".idea/**",
  ".cursor/**",
  "",
  "# Test & CI",
  "tests/**",
  "__tests__/**",
  ".github/**",
  "",
  "# Build artifacts",
  "dist/**",
  "build/**",
  "",
  "# Large media not needed at runtime",
  "# *.mp4",
  "# *.mov",
  "",
].join("\n")

// ---------------------------------------------------------------------------
// Claude-specific init flow
// ---------------------------------------------------------------------------

async function initClaude(
  cwd: string,
  config: { username?: string },
  adapter: ReturnType<typeof resolvePlatform>
): Promise<void> {
  // Discover agents
  if (!adapter.discoverAgents) {
    console.log(chalk.red("Claude adapter missing discoverAgents method."))
    process.exit(1)
  }

  const agents = adapter.discoverAgents(cwd)
  if (agents.length === 0) {
    console.log(
      chalk.red(
        "No agents found.\n" +
        "Create an agent in ~/.claude/agents/ or ./agents/ first."
      )
    )
    process.exit(1)
  }

  // Agent picker (multi-select)
  let selectedAgents = agents
  if (agents.length > 1) {
    const { chosen } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "chosen",
        message: "Which agents do you want to init for the marketplace?",
        choices: agents.map((a) => ({
          name: `${a.name}${a.description ? ` — ${a.description}` : ""}`,
          value: a.name,
          checked: true,
        })),
        validate: (val: string[]) =>
          val.length > 0 || "Select at least one agent",
      },
    ])
    selectedAgents = agents.filter((a) => chosen.includes(a.name))
  } else {
    console.log()
    console.log(
      chalk.dim(`  Found agent: ${chalk.bold(agents[0].name)}${agents[0].description ? ` — ${agents[0].description}` : ""}`)
    )
  }

  // Check for existing .web42/ agents that are already init'd
  const web42Dir = join(cwd, ".web42")
  const existingInits = new Set<string>()
  if (existsSync(web42Dir)) {
    try {
      const entries = readdirSync(web42Dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && existsSync(join(web42Dir, entry.name, "manifest.json"))) {
          existingInits.add(entry.name)
        }
      }
    } catch {
      // skip
    }
  }

  const toInit = selectedAgents.filter((a) => !existingInits.has(a.name))
  const alreadyInit = selectedAgents.filter((a) => existingInits.has(a.name))

  if (alreadyInit.length > 0) {
    console.log(
      chalk.dim(`  Already initialized: ${alreadyInit.map((a) => a.name).join(", ")}`)
    )
  }

  if (toInit.length === 0 && alreadyInit.length > 0) {
    // Ask if they want to re-init
    const { reinit } = await inquirer.prompt([
      {
        type: "confirm",
        name: "reinit",
        message: "All selected agents are already initialized. Re-initialize?",
        default: false,
      },
    ])
    if (!reinit) {
      console.log(chalk.yellow("Aborted."))
      return
    }
    toInit.push(...alreadyInit)
  }

  // For each agent: resolve skills, prompt, create .web42/{name}/ metadata
  for (const agent of toInit.length > 0 ? toInit : selectedAgents) {
    console.log()
    console.log(chalk.bold(`Initializing ${agent.name}...`))

    // Resolve skills
    let resolvedSkills: Array<{ name: string; description: string }> = []
    if (agent.skills.length > 0 && adapter.resolveSkills) {
      const resolved = adapter.resolveSkills(agent.skills, cwd)
      const found = resolved.filter((s) => s.found)
      const missing = resolved.filter((s) => !s.found)

      if (found.length > 0) {
        // Read SKILL.md for descriptions
        resolvedSkills = found.map((s) => {
          const skillMd = join(s.sourcePath, "SKILL.md")
          if (existsSync(skillMd)) {
            const content = readFileSync(skillMd, "utf-8")
            const parsed = parseSkillMd(content, s.name)
            return { name: parsed.name, description: parsed.description }
          }
          return { name: s.name, description: `Skill: ${s.name}` }
        })
        console.log(
          chalk.dim(`  Resolved ${found.length} skill(s): ${found.map((s) => s.name).join(", ")}`)
        )
      }

      if (missing.length > 0) {
        console.log(
          chalk.yellow(`  Skills not found: ${missing.map((s) => s.name).join(", ")}`)
        )
      }
    }

    // Also detect workspace skills (in case agent references skills in cwd/skills/)
    const workspaceSkills = detectWorkspaceSkills(cwd)
    const existingNames = new Set(resolvedSkills.map((s) => s.name))
    for (const ws of workspaceSkills) {
      if (!existingNames.has(ws.name)) {
        resolvedSkills.push(ws)
      }
    }

    // Prompt for description and version
    const defaults = {
      description: agent.description ?? "",
      version: "1.0.0",
    }

    // Check if manifest already exists for this agent
    const agentWeb42Dir = join(web42Dir, agent.name)
    const existingManifestPath = join(agentWeb42Dir, "manifest.json")
    let existingManifest: Record<string, unknown> | null = null
    if (existsSync(existingManifestPath)) {
      try {
        existingManifest = JSON.parse(readFileSync(existingManifestPath, "utf-8"))
      } catch {
        // ignore
      }
    }

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "description",
        message: `  Description for ${agent.name}:`,
        default: (existingManifest?.description as string) ?? defaults.description,
        validate: (val: string) =>
          (val.length > 0 && val.length <= 500) || "1-500 characters",
      },
      {
        type: "input",
        name: "version",
        message: "  Version:",
        default: (existingManifest?.version as string) ?? defaults.version,
        validate: (val: string) =>
          /^\d+\.\d+\.\d+$/.test(val) || "Must follow semver (e.g. 1.0.0)",
      },
    ])

    // Create per-agent .web42/{name}/ directory
    mkdirSync(agentWeb42Dir, { recursive: true })

    // Write manifest
    const manifest = {
      format: "agentpkg/1",
      platform: "claude",
      name: agent.name,
      description: answers.description,
      version: answers.version,
      author: config.username ?? "",
      skills: resolvedSkills,
      plugins: [] as string[],
      modelPreferences: agent.model
        ? { primary: agent.model }
        : undefined,
      configVariables: [] as Array<{
        key: string
        label: string
        required: boolean
      }>,
    }

    writeFileSync(
      join(agentWeb42Dir, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n"
    )
    console.log(chalk.green(`  Created .web42/${agent.name}/manifest.json`))

    // Write marketplace.json
    const marketplacePath = join(agentWeb42Dir, "marketplace.json")
    if (!existsSync(marketplacePath)) {
      writeFileSync(
        marketplacePath,
        JSON.stringify(DEFAULT_MARKETPLACE, null, 2) + "\n"
      )
      console.log(chalk.green(`  Created .web42/${agent.name}/marketplace.json`))
    }

    // Write .web42ignore
    const ignorePath = join(agentWeb42Dir, ".web42ignore")
    if (!existsSync(ignorePath)) {
      writeFileSync(ignorePath, WEB42_IGNORE_CONTENT, "utf-8")
      console.log(chalk.green(`  Created .web42/${agent.name}/.web42ignore`))
    }
  }

  console.log()
  console.log(
    chalk.dim(
      "Edit .web42/{agent}/marketplace.json to set price, tags, license, and visibility."
    )
  )
  console.log(
    chalk.dim(
      "Run `web42 pack` to bundle your agents, or `web42 push` to pack and publish."
    )
  )
}

// ---------------------------------------------------------------------------
// OpenClaw init flow (existing behavior)
// ---------------------------------------------------------------------------

async function initOpenclaw(
  cwd: string,
  config: { username?: string },
  adapter: ReturnType<typeof resolvePlatform>,
  platform: string,
  opts: { withSkills?: boolean | string[] }
): Promise<void> {
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
      // ignore
    }
  }

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
    author: config.username ?? "",
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
    console.log(chalk.green(`  Scaffolded: ${created.join(", ")}`))
  }
  if (skipped.length > 0) {
    console.log(chalk.dim(`  Skipped (already exist): ${skipped.join(", ")}`))
  }

  // Scaffold .web42/ metadata folder
  const web42Dir = join(cwd, ".web42")
  mkdirSync(web42Dir, { recursive: true })

  const marketplacePath = join(web42Dir, "marketplace.json")
  if (!existsSync(marketplacePath)) {
    writeMarketplace(cwd, { ...DEFAULT_MARKETPLACE })
    console.log(chalk.green(`  Created ${chalk.bold(".web42/marketplace.json")}`))
  } else {
    console.log(chalk.dim("  Skipped .web42/marketplace.json (already exists)"))
  }

  const resourcesJsonPath = join(web42Dir, "resources.json")
  if (!existsSync(resourcesJsonPath)) {
    writeResourcesMeta(cwd, [])
    console.log(chalk.green(`  Created ${chalk.bold(".web42/resources.json")}`))
  } else {
    console.log(chalk.dim("  Skipped .web42/resources.json (already exists)"))
  }

  mkdirSync(join(web42Dir, "resources"), { recursive: true })

  const ignorePath = join(cwd, ".web42ignore")
  if (!existsSync(ignorePath)) {
    writeFileSync(ignorePath, WEB42_IGNORE_CONTENT, "utf-8")
    console.log(chalk.green(`  Created ${chalk.bold(".web42ignore")}`))
  } else {
    console.log(chalk.dim("  Skipped .web42ignore (already exists)"))
  }

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
        console.log(chalk.yellow(`  Unknown skill(s): ${unknown.join(", ")}`))
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
        console.log(chalk.green(`  Added starter skill(s): ${installed.join(", ")}`))
      }
    }
  }

  console.log()
  console.log(
    chalk.dim("Edit .web42/marketplace.json to set price, tags, license, and visibility.")
  )
  console.log(
    chalk.dim("Run `web42 pack` to bundle your agent, or `web42 push` to pack and publish.")
  )
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const initCommand = new Command("init")
  .description("Create a manifest.json for your agent package")
  .option(
    "--with-skills [names...]",
    "Add bundled starter skills (omit names to install all)"
  )
  .action(async (opts: { withSkills?: boolean | string[] }) => {
    const config = requireAuth()
    const cwd = process.cwd()

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

    if (platform === "claude") {
      await initClaude(cwd, config, adapter)
    } else {
      await initOpenclaw(cwd, config, adapter, platform, opts)
    }
  })
