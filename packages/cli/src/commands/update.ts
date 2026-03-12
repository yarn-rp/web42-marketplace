import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import type { PlatformAdapter } from "../platforms/base.js"
import { apiGet, apiPost } from "../utils/api.js"

function resolveTemplateVars(
  content: string,
  platformHome: string,
  workspacePath: string
): string {
  return content
    .replace(/\{\{OPENCLAW_HOME\}\}/g, platformHome)
    .replace(/\{\{WORKSPACE\}\}/g, workspacePath)
}

export function makeUpdateCommand(adapter: PlatformAdapter): Command {
  return new Command("update")
    .description("Update an installed agent to the latest version")
    .argument("<agent>", "Agent to update (e.g. @user/agent-name)")
    .action(async (agentRef: string) => {
      const match = agentRef.match(/^@?([^/]+)\/(.+)$/)
      if (!match) {
        console.log(
          chalk.red("Invalid agent reference. Use @user/agent-name format.")
        )
        process.exit(1)
      }

      const [, username, agentSlug] = match
      const spinner = ora(
        `Checking for updates to @${username}/${agentSlug}...`
      ).start()

      try {
        const agents = await apiGet<
          Array<{
            id: string
            slug: string
            owner: { username: string }
          }>
        >(`/api/agents?username=${username}`)

        const agent = agents.find((a) => a.slug === agentSlug)
        if (!agent) {
          spinner.fail(`Agent @${username}/${agentSlug} not found`)
          process.exit(1)
        }

        const result = await apiPost<{
          agent: {
            id: string
            slug: string
            manifest: Record<string, unknown>
          }
          files: Array<{
            path: string
            content: string | null
            content_hash: string
          }>
        }>(`/api/agents/${agent.id}/install`, {})

        spinner.text = "Applying updates..."

        const workspacePath = join(adapter.home, `workspace-${agentSlug}`)
        mkdirSync(workspacePath, { recursive: true })

        let updated = 0
        for (const file of result.files) {
          if (file.path === ".openclaw/config.json") continue

          const filePath = join(workspacePath, file.path)
          mkdirSync(dirname(filePath), { recursive: true })

          if (file.content !== null && file.content !== undefined) {
            const resolved = resolveTemplateVars(
              file.content,
              adapter.home,
              workspacePath
            )
            writeFileSync(filePath, resolved, "utf-8")
            updated++
          }
        }

        if (result.agent.manifest) {
          const manifestPath = join(workspacePath, "manifest.json")
          writeFileSync(
            manifestPath,
            JSON.stringify(result.agent.manifest, null, 2) + "\n"
          )
        }

        spinner.succeed(
          `Updated ${chalk.bold(`@${username}/${agentSlug}`)} (${updated} files)`
        )
      } catch (error: any) {
        spinner.fail("Update failed")
        console.error(chalk.red(error.message))
        process.exit(1)
      }
    })
}
