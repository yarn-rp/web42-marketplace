import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { resolvePlatform } from "../platforms/registry.js"
import { parseSkillMd } from "../utils/skill.js"

/**
 * Pack a single agent: run adapter.pack(), detect skills, write to dist.
 */
async function packSingleAgent(opts: {
  cwd: string
  manifest: Record<string, unknown>
  manifestPath: string
  adapter: ReturnType<typeof resolvePlatform>
  agentName?: string
  outputDir: string
  dryRun?: boolean
}) {
  const { cwd, adapter, agentName, dryRun } = opts
  // Clone manifest so per-agent enrichment doesn't leak
  const manifest = JSON.parse(JSON.stringify(opts.manifest))

  const result = await adapter.pack({
    cwd,
    outputDir: opts.outputDir,
    agentName,
  })

  // Detect skills from packed files and strip internal ones
  const internalSkillPrefixes: string[] = []
  const detectedSkills: Array<{ name: string; description: string }> = []
  for (const f of result.files) {
    const match = f.path.match(/^skills\/([^/]+)\/SKILL\.md$/)
    if (match) {
      const parsed = parseSkillMd(f.content, match[1])
      if (parsed.internal) {
        internalSkillPrefixes.push(`skills/${match[1]}/`)
      } else {
        detectedSkills.push({ name: parsed.name, description: parsed.description })
      }
    }
  }
  if (internalSkillPrefixes.length > 0) {
    result.files = result.files.filter(
      (f) => !internalSkillPrefixes.some((prefix) => f.path.startsWith(prefix))
    )
  }
  if (detectedSkills.length > 0) {
    manifest.skills = detectedSkills.sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }

  // Merge auto-generated config variables into manifest
  const existingKeys = new Set(
    (manifest.configVariables ?? []).map((v: { key: string }) => v.key)
  )
  for (const cv of result.configVariables) {
    if (!existingKeys.has(cv.key)) {
      if (!manifest.configVariables) manifest.configVariables = []
      manifest.configVariables.push(cv)
      existingKeys.add(cv.key)
    }
  }

  if (dryRun) {
    const label = agentName ? `Dry run for ${chalk.bold(agentName)}` : "Dry run"
    console.log(chalk.bold(`${label} — would pack:`))
    console.log()
    for (const f of result.files) {
      console.log(chalk.dim(`  ${f.path} (${f.content.length} bytes)`))
    }
    console.log()
    console.log(
      chalk.dim(`${result.files.length} files, ${result.configVariables.length} config variable(s)`)
    )
    return { manifest, result }
  }

  const outputDir = join(cwd, opts.outputDir)
  mkdirSync(outputDir, { recursive: true })

  for (const file of result.files) {
    const filePath = join(outputDir, file.path)
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, file.content, "utf-8")
  }

  writeFileSync(
    join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  )

  return { manifest, result }
}

export const packCommand = new Command("pack")
  .description("Pack your agent workspace into a distributable artifact")
  .option("-o, --output <dir>", "Output directory", ".web42/dist")
  .option("--dry-run", "Preview what would be packed without writing files")
  .option("--agent <name>", "Pack a specific agent (for multi-agent workspaces)")
  .action(async (opts: { output: string; dryRun?: boolean; agent?: string }) => {
    const cwd = process.cwd()

    // Determine platform: check for per-agent manifests first, then root manifest
    let platform = "openclaw" // default
    let isMultiAgent = false
    const agentManifests = new Map<string, Record<string, unknown>>()

    // Check if this is a multi-agent workspace (per-agent manifests in .web42/{name}/)
    const web42Dir = join(cwd, ".web42")
    if (existsSync(web42Dir)) {
      const { readdirSync } = await import("fs")
      try {
        const entries = readdirSync(web42Dir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          const agentManifestPath = join(web42Dir, entry.name, "manifest.json")
          if (existsSync(agentManifestPath)) {
            try {
              const m = JSON.parse(readFileSync(agentManifestPath, "utf-8"))
              agentManifests.set(entry.name, m)
              if (m.platform) platform = m.platform
            } catch {
              // skip invalid manifests
            }
          }
        }
      } catch {
        // .web42 not readable
      }
    }

    isMultiAgent = agentManifests.size > 0

    // Fall back to root manifest.json (single-agent, e.g., OpenClaw)
    if (!isMultiAgent) {
      const manifestPath = join(cwd, "manifest.json")
      if (!existsSync(manifestPath)) {
        console.log(
          chalk.red("No manifest.json found. Run `web42 init` first.")
        )
        process.exit(1)
      }

      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
      if (!manifest.name || !manifest.version || !manifest.author) {
        console.log(
          chalk.red("Invalid manifest.json. Must have name, version, and author.")
        )
        process.exit(1)
      }

      if (manifest.platform) platform = manifest.platform

      const adapter = resolvePlatform(platform)
      const spinner = ora("Packing agent...").start()

      try {
        const { manifest: enriched, result } = await packSingleAgent({
          cwd,
          manifest,
          manifestPath,
          adapter,
          outputDir: opts.output,
          dryRun: opts.dryRun,
        })

        if (opts.dryRun) {
          spinner.stop()
          return
        }

        spinner.succeed(
          `Packed ${chalk.bold(enriched.name)} (${result.files.length} files) → ${opts.output}/`
        )
        if (result.configVariables.length > 0) {
          console.log(
            chalk.dim(`  ${result.configVariables.length} config variable(s) detected`)
          )
        }
        console.log()
        console.log(chalk.dim("Run `web42 push` to publish to the marketplace."))
      } catch (error: any) {
        spinner.fail("Pack failed")
        console.error(chalk.red(error.message))
        process.exit(1)
      }
      return
    }

    // Multi-agent mode
    const adapter = resolvePlatform(platform)

    // Determine which agents to pack
    let agentsToPack: Array<[string, Record<string, unknown>]>
    if (opts.agent) {
      const manifest = agentManifests.get(opts.agent)
      if (!manifest) {
        console.log(
          chalk.red(
            `Agent "${opts.agent}" not found. Available: ${[...agentManifests.keys()].join(", ")}`
          )
        )
        process.exit(1)
      }
      agentsToPack = [[opts.agent, manifest]]
    } else {
      agentsToPack = [...agentManifests.entries()]
    }

    const spinner = ora(`Packing ${agentsToPack.length} agent(s)...`).start()

    try {
      for (const [agentName, manifest] of agentsToPack) {
        const agentOutputDir = join(".web42", agentName, "dist")
        spinner.text = `Packing ${agentName}...`

        if (opts.dryRun) {
          spinner.stop()
        }

        const { manifest: enriched, result } = await packSingleAgent({
          cwd,
          manifest,
          manifestPath: join(web42Dir, agentName, "manifest.json"),
          adapter,
          agentName,
          outputDir: agentOutputDir,
          dryRun: opts.dryRun,
        })

        if (!opts.dryRun) {
          // Also write the enriched manifest back
          writeFileSync(
            join(web42Dir, agentName, "manifest.json"),
            JSON.stringify(enriched, null, 2) + "\n"
          )
          console.log(
            chalk.green(
              `  Packed ${chalk.bold(agentName)} (${result.files.length} files) → ${agentOutputDir}/`
            )
          )
        }

        if (opts.dryRun) {
          console.log() // spacing between agents
          spinner.start()
        }
      }

      if (opts.dryRun) {
        spinner.stop()
      } else {
        spinner.succeed(
          `Packed ${agentsToPack.length} agent(s)`
        )
        console.log()
        console.log(chalk.dim("Run `web42 push` to publish to the marketplace."))
      }
    } catch (error: any) {
      spinner.fail("Pack failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
