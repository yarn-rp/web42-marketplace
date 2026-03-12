import { Command } from "commander"
import chalk from "chalk"

import type { PlatformAdapter } from "../platforms/base.js"

export function makeListCommand(adapter: PlatformAdapter): Command {
  return new Command("list")
    .description("List installed agents")
    .action(async () => {
      const agents = await adapter.listInstalled()

      if (agents.length === 0) {
        console.log(chalk.yellow("No agents installed."))
        console.log(
          chalk.dim(
            `Run \`web42 ${adapter.name} install @user/agent\` to install one.`
          )
        )
        return
      }

      console.log(chalk.bold(`Installed ${adapter.name} agents:`))
      console.log()
      for (const agent of agents) {
        console.log(`  ${chalk.cyan(agent.source ?? agent.name)}`)
        if (agent.workspace) {
          console.log(chalk.dim(`    ${agent.workspace}`))
        }
      }
    })
}
