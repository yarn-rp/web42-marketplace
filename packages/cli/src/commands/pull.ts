import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiGet } from "../utils/api.js"
import { requireAuth } from "../utils/config.js"

interface AgentListItem {
  id: string
  slug: string
  name: string
  manifest: Record<string, unknown>
  owner: { username: string }
}

interface AgentFile {
  path: string
  content: string | null
  content_hash: string
}

export const pullCommand = new Command("pull")
  .description("Pull latest agent files from the Web42 marketplace into the current directory")
  .action(async () => {
    const config = requireAuth()
    const cwd = process.cwd()
    const manifestPath = join(cwd, "manifest.json")

    if (!existsSync(manifestPath)) {
      console.log(
        chalk.red("No manifest.json found. Are you in an agent directory?")
      )
      process.exit(1)
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
    if (!manifest.name) {
      console.log(chalk.red("manifest.json is missing a name field."))
      process.exit(1)
    }

    const spinner = ora(
      `Pulling @${config.username}/${manifest.name}...`
    ).start()

    try {
      const agents = await apiGet<AgentListItem[]>(
        `/api/agents?username=${config.username}`
      )

      const agent = agents.find((a) => a.slug === manifest.name)
      if (!agent) {
        spinner.fail(
          `Agent @${config.username}/${manifest.name} not found on the marketplace. Run \`web42 push\` first.`
        )
        process.exit(1)
      }

      const files = await apiGet<AgentFile[]>(
        `/api/agents/${agent.id}/files?include_content=true`
      )

      if (files.length === 0) {
        spinner.succeed("Agent is up to date (no files on remote).")
        return
      }

      let written = 0
      let skipped = 0

      for (const file of files) {
        if (file.content === null || file.content === undefined) {
          skipped++
          continue
        }

        // Skip packaging artifacts that are regenerated on push
        if (file.path === ".openclaw/config.json") {
          skipped++
          continue
        }

        const filePath = join(cwd, file.path)
        mkdirSync(dirname(filePath), { recursive: true })
        writeFileSync(filePath, file.content, "utf-8")
        written++
      }

      if (agent.manifest) {
        writeFileSync(
          manifestPath,
          JSON.stringify(agent.manifest, null, 2) + "\n"
        )
      }

      spinner.succeed(
        `Pulled ${chalk.bold(`@${config.username}/${manifest.name}`)} (${written} files written${skipped > 0 ? `, ${skipped} skipped` : ""})`
      )
    } catch (error: any) {
      spinner.fail("Pull failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
