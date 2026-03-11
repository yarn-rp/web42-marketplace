import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { homedir } from "os"
import { Command } from "commander"
import chalk from "chalk"
import inquirer from "inquirer"
import ora from "ora"

import { apiGet, apiPost } from "../utils/api.js"

interface InstallResult {
  agent: {
    id: string
    slug: string
    name: string
    manifest: {
      configVariables?: Array<{
        key: string
        label: string
        description?: string
        required: boolean
        default?: string
      }>
      skills?: string[]
      plugins?: string[]
    }
    owner: { username: string }
  }
  files: Array<{
    path: string
    content: string | null
    storage_url: string
    content_hash: string
  }>
}

const OPENCLAW_HOME = join(homedir(), ".openclaw")

function resolveTemplateVars(content: string, workspacePath: string): string {
  return content
    .replace(/\{\{OPENCLAW_HOME\}\}/g, OPENCLAW_HOME)
    .replace(/\{\{WORKSPACE\}\}/g, workspacePath)
}

export const installCommand = new Command("install")
  .description("Install an agent package from the marketplace")
  .argument("<agent>", "Agent to install (e.g. @user/agent-name)")
  .action(async (agentRef: string) => {
    const match = agentRef.match(/^@?([^/]+)\/(.+)$/)
    if (!match) {
      console.log(
        chalk.red("Invalid agent reference. Use @user/agent-name format.")
      )
      process.exit(1)
    }

    const [, username, agentSlug] = match
    const spinner = ora(`Fetching @${username}/${agentSlug}...`).start()

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

      const result = await apiPost<InstallResult>(
        `/api/agents/${agent.id}/install`,
        {}
      )

      spinner.text = "Setting up workspace..."

      const workspacePath = join(OPENCLAW_HOME, `workspace-${agentSlug}`)
      mkdirSync(workspacePath, { recursive: true })

      let filesWritten = 0
      for (const file of result.files) {
        const filePath = join(workspacePath, file.path)
        mkdirSync(dirname(filePath), { recursive: true })

        if (file.content !== null && file.content !== undefined) {
          const resolved = resolveTemplateVars(file.content, workspacePath)
          writeFileSync(filePath, resolved, "utf-8")
        } else {
          writeFileSync(
            filePath,
            `# Placeholder - content not available\n# File: ${file.path}\n# Hash: ${file.content_hash}\n`
          )
        }
        filesWritten++
      }

      spinner.text = "Configuring..."

      const manifest = result.agent.manifest
      if (manifest.skills && manifest.skills.length > 0) {
        const skillsDir = join(OPENCLAW_HOME, "skills")
        mkdirSync(skillsDir, { recursive: true })
        for (const skill of manifest.skills) {
          const skillDir = join(skillsDir, skill)
          mkdirSync(skillDir, { recursive: true })
        }
      }

      if (manifest.configVariables && manifest.configVariables.length > 0) {
        spinner.stop()
        console.log()
        console.log(chalk.bold("Configure your agent:"))
        console.log()

        const configAnswers = await inquirer.prompt(
          manifest.configVariables.map((v) => ({
            type: "input" as const,
            name: v.key,
            message: `${v.label}${v.description ? ` (${v.description})` : ""}:`,
            default: v.default,
            validate: (val: string) =>
              !v.required || val.length > 0 || `${v.label} is required`,
          }))
        )

        const configPath = join(workspacePath, ".web42.config.json")
        writeFileSync(
          configPath,
          JSON.stringify(configAnswers, null, 2) + "\n"
        )
      } else {
        spinner.stop()
      }

      const openclawConfigPath = join(OPENCLAW_HOME, "openclaw.json")
      if (existsSync(openclawConfigPath)) {
        try {
          const openclawConfig = JSON.parse(
            readFileSync(openclawConfigPath, "utf-8")
          )
          if (!openclawConfig.agents) openclawConfig.agents = { list: [] }
          if (!openclawConfig.agents.list) openclawConfig.agents.list = []

          const existing = openclawConfig.agents.list.findIndex(
            (a: { name: string }) => a.name === agentSlug
          )
          const entry = {
            name: agentSlug,
            source: `@${username}/${agentSlug}`,
            workspace: workspacePath,
          }
          if (existing >= 0) {
            openclawConfig.agents.list[existing] = entry
          } else {
            openclawConfig.agents.list.push(entry)
          }

          writeFileSync(
            openclawConfigPath,
            JSON.stringify(openclawConfig, null, 2) + "\n"
          )
        } catch {
          // Silently skip if config is malformed
        }
      }

      console.log()
      console.log(
        chalk.green(
          `Installed ${chalk.bold(`@${username}/${agentSlug}`)} to ${workspacePath}`
        )
      )
      console.log()
      console.log(chalk.dim(`${filesWritten} files written:`))
      for (const file of result.files) {
        console.log(chalk.dim(`  ${file.path}`))
      }
    } catch (error: any) {
      spinner.fail("Install failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
