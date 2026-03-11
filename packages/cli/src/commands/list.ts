import { existsSync, readFileSync, readdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { Command } from "commander"
import chalk from "chalk"

const OPENCLAW_HOME = join(homedir(), ".openclaw")

export const listCommand = new Command("list")
  .description("List installed marketplace agents")
  .action(() => {
    // Check openclaw.json
    const configPath = join(OPENCLAW_HOME, "openclaw.json")
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, "utf-8"))
        if (config.agents?.list?.length > 0) {
          console.log(chalk.bold("Installed agents:"))
          console.log()
          for (const agent of config.agents.list) {
            console.log(`  ${chalk.cyan(agent.source || agent.name)}`)
            if (agent.workspace) {
              console.log(chalk.dim(`    ${agent.workspace}`))
            }
          }
          return
        }
      } catch {
        // Fall through
      }
    }

    // Fallback: scan workspace directories
    const workspaceDirs = existsSync(OPENCLAW_HOME)
      ? readdirSync(OPENCLAW_HOME).filter((d) =>
          d.startsWith("workspace-")
        )
      : []

    if (workspaceDirs.length === 0) {
      console.log(chalk.yellow("No agents installed."))
      console.log(
        chalk.dim("Run `web42 install @user/agent` to install one.")
      )
      return
    }

    console.log(chalk.bold("Installed agent workspaces:"))
    console.log()
    for (const dir of workspaceDirs) {
      const name = dir.replace("workspace-", "")
      console.log(`  ${chalk.cyan(name)}`)
      console.log(chalk.dim(`    ${join(OPENCLAW_HOME, dir)}`))
    }
  })
