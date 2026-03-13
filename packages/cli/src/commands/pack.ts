import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { openclawAdapter } from "../platforms/openclaw/adapter.js"
import { parseSkillMd } from "../utils/skill.js"

export const packCommand = new Command("pack")
  .description("Pack your agent workspace into a distributable artifact")
  .option("-o, --output <dir>", "Output directory", ".web42")
  .option("--dry-run", "Preview what would be packed without writing files")
  .action(async (opts: { output: string; dryRun?: boolean }) => {
    const cwd = process.cwd()
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
        chalk.red(
          "Invalid manifest.json. Must have name, version, and author."
        )
      )
      process.exit(1)
    }

    const spinner = ora("Packing agent...").start()

    try {
      const result = await openclawAdapter.pack({ cwd, outputDir: opts.output })

      // Detect skills from packed files (skills/*/SKILL.md pattern)
      const detectedSkills: Array<{ name: string; description: string }> = []
      for (const f of result.files) {
        const match = f.path.match(/^skills\/([^/]+)\/SKILL\.md$/)
        if (match) {
          const parsed = parseSkillMd(f.content, match[1])
          detectedSkills.push(parsed)
        }
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

      if (opts.dryRun) {
        spinner.stop()
        console.log(chalk.bold("Dry run — would pack:"))
        console.log()
        for (const f of result.files) {
          console.log(chalk.dim(`  ${f.path} (${f.content.length} bytes)`))
        }
        console.log()
        console.log(
          chalk.dim(`${result.files.length} files, ${result.configVariables.length} config variable(s)`)
        )
        return
      }

      const outputDir = join(cwd, opts.output)
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

      spinner.succeed(
        `Packed ${chalk.bold(manifest.name)} (${result.files.length} files) → ${opts.output}/`
      )

      if (result.configVariables.length > 0) {
        console.log(
          chalk.dim(
            `  ${result.configVariables.length} config variable(s) detected`
          )
        )
      }

      console.log()
      console.log(chalk.dim("Run `web42 push` to publish to the marketplace."))
    } catch (error: any) {
      spinner.fail("Pack failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
