import { appendFileSync, existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import inquirer from "inquirer"
import ora from "ora"

import type { PlatformAdapter } from "../platforms/base.js"
import { apiGet, apiPost } from "../utils/api.js"

interface MarketplaceInstallResult {
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
      modelPreferences?: { primary?: string }
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

function deriveProviderEnvKey(model: string): {
  provider: string
  envKey: string
} | null {
  const slash = model.indexOf("/")
  if (slash < 1) return null
  const provider = model.slice(0, slash)
  const envKey = `${provider.toUpperCase().replace(/-/g, "_")}_API_KEY`
  return { provider, envKey }
}

function isKeyConfigured(envKey: string, platformHome: string): boolean {
  if (process.env[envKey]) return true
  const dotenvPath = join(platformHome, ".env")
  if (!existsSync(dotenvPath)) return false
  try {
    const content = readFileSync(dotenvPath, "utf-8")
    return content.split("\n").some((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith("#")) return false
      const eqIdx = trimmed.indexOf("=")
      return eqIdx > 0 && trimmed.slice(0, eqIdx).trim() === envKey
    })
  } catch {
    return false
  }
}

function appendToEnv(envKey: string, value: string, platformHome: string): void {
  const dotenvPath = join(platformHome, ".env")
  const line = `${envKey}=${value}\n`
  appendFileSync(dotenvPath, line, "utf-8")
}

export function makeInstallCommand(adapter: PlatformAdapter): Command {
  return new Command("install")
    .description("Install an agent package from the marketplace")
    .argument("<agent>", "Agent to install (e.g. @user/agent-name)")
    .option("--as <name>", "Install under a different local agent name")
    .option("--no-prompt", "Skip config variable prompts, use defaults")
    .action(async (agentRef: string, opts: { as?: string; prompt?: boolean }) => {
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

        const result = await apiPost<MarketplaceInstallResult>(
          `/api/agents/${agent.id}/install`,
          {}
        )

        const manifest = result.agent.manifest
        let configAnswers: Record<string, string> = {}

        if (manifest.configVariables && manifest.configVariables.length > 0) {
          if (opts.prompt === false) {
            for (const v of manifest.configVariables) {
              configAnswers[v.key] = v.default ?? ""
            }
            spinner.text = "Installing agent (skipping prompts)..."
          } else {
            spinner.stop()
            console.log()
            console.log(chalk.bold("Configure your agent:"))
            console.log()

            configAnswers = await inquirer.prompt(
              manifest.configVariables.map((v) => ({
                type: "input" as const,
                name: v.key,
                message: `${v.label}${v.description ? ` (${v.description})` : ""}:`,
                default: v.default,
                validate: (val: string) =>
                  !v.required || val.length > 0 || `${v.label} is required`,
              }))
            )

            spinner.start("Installing agent...")
          }
        } else {
          spinner.text = "Installing agent..."
        }

        const primaryModel = manifest.modelPreferences?.primary
        if (primaryModel) {
          const providerInfo = deriveProviderEnvKey(primaryModel)
          if (providerInfo) {
            if (isKeyConfigured(providerInfo.envKey, adapter.home)) {
              if (spinner.isSpinning) spinner.stop()
              console.log(
                chalk.dim(
                  `  ${providerInfo.envKey} already configured for ${primaryModel}`
                )
              )
              if (!spinner.isSpinning) spinner.start("Installing agent...")
            } else if (opts.prompt === false) {
              if (spinner.isSpinning) spinner.stop()
              console.log()
              console.log(
                chalk.yellow(
                  `  This agent uses ${chalk.bold(primaryModel)}. You'll need to set ${chalk.bold(providerInfo.envKey)} in ${adapter.home}/.env or as an environment variable.`
                )
              )
              spinner.start("Installing agent...")
            } else {
              if (spinner.isSpinning) spinner.stop()
              console.log()
              console.log(
                chalk.bold(
                  `This agent uses ${chalk.cyan(primaryModel)}.`
                )
              )
              const { apiKey } = await inquirer.prompt([
                {
                  type: "password",
                  name: "apiKey",
                  message: `Enter your ${providerInfo.envKey} (leave empty to skip):`,
                  mask: "*",
                },
              ])
              if (apiKey) {
                appendToEnv(providerInfo.envKey, apiKey, adapter.home)
                console.log(
                  chalk.green(
                    `  Saved ${providerInfo.envKey} to ${adapter.home}/.env`
                  )
                )
              } else {
                console.log(
                  chalk.yellow(
                    `  Skipped. Set ${chalk.bold(providerInfo.envKey)} in ${adapter.home}/.env later.`
                  )
                )
              }
              spinner.start("Installing agent...")
            }
          }
        }

        let configTemplate: Record<string, unknown> | null = null
        const configFile = result.files.find(
          (f) => f.path === ".openclaw/config.json" && f.content
        )
        if (configFile?.content) {
          try {
            configTemplate = JSON.parse(configFile.content)
          } catch {
            // No config template available
          }
        }

        const localName = opts.as ?? agentSlug
        const workspacePath = join(adapter.home, `workspace-${localName}`)

        const installResult = await adapter.install({
          agentSlug: localName,
          username,
          workspacePath,
          files: result.files,
          configTemplate,
          configAnswers,
        })

        const web42Config = {
          source: `@${username}/${agentSlug}`,
          ...configAnswers,
        }
        const configPath = join(workspacePath, ".web42.config.json")
        writeFileSync(
          configPath,
          JSON.stringify(web42Config, null, 2) + "\n"
        )

        spinner.stop()

        console.log()
        console.log(
          chalk.green(
            `Installed ${chalk.bold(`@${username}/${agentSlug}`)} as agent "${localName}"`
          )
        )
        console.log(chalk.dim(`  Workspace: ${workspacePath}`))
        if (manifest.skills && manifest.skills.length > 0) {
          console.log(chalk.dim(`  Skills: ${manifest.skills.join(", ")}`))
        }
        console.log(chalk.dim(`  ${installResult.filesWritten} files written`))

        const pendingVars = (manifest.configVariables ?? []).filter(
          (v) => v.required && !configAnswers[v.key]
        )
        if (pendingVars.length > 0) {
          console.log()
          console.log(
            chalk.yellow(
              `  ${pendingVars.length} config variable(s) still need setup:`
            )
          )
          for (const v of pendingVars) {
            console.log(chalk.yellow(`    - ${v.label} (${v.key})`))
          }
        }

        console.log()
        console.log(chalk.dim("  Next steps:"))
        console.log(chalk.dim(`    1. Set up channel bindings:  ${adapter.name} config`))
        console.log(
          chalk.dim(`    2. Restart the gateway:      ${adapter.name} gateway restart`)
        )
      } catch (error: any) {
        spinner.fail("Install failed")
        console.error(chalk.red(error.message))
        process.exit(1)
      }
    })
}
