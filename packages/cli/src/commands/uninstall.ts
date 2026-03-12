import { Command } from "commander"
import chalk from "chalk"
import inquirer from "inquirer"
import ora from "ora"

import type { PlatformAdapter } from "../platforms/base.js"

export function makeUninstallCommand(adapter: PlatformAdapter): Command {
  return new Command("uninstall")
    .description("Uninstall an agent")
    .argument("<agent>", "Local agent name to uninstall")
    .option("-f, --force", "Skip confirmation prompt")
    .action(async (agentName: string, opts: { force?: boolean }) => {
      const installed = await adapter.listInstalled()
      const found = installed.find((a) => a.name === agentName)

      if (!found) {
        console.log(
          chalk.red(`Agent "${agentName}" is not installed on ${adapter.name}.`)
        )
        const available = installed.map((a) => a.name)
        if (available.length > 0) {
          console.log(
            chalk.dim(`  Installed agents: ${available.join(", ")}`)
          )
        }
        process.exit(1)
      }

      if (!opts.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: `Remove agent "${agentName}" and all its workspace files?`,
            default: false,
          },
        ])
        if (!confirm) {
          console.log(chalk.dim("Aborted."))
          return
        }
      }

      const spinner = ora(`Uninstalling "${agentName}"...`).start()

      try {
        const result = await adapter.uninstall({ agentName })

        if (result.removed) {
          spinner.succeed(`Uninstalled "${agentName}"`)
          for (const p of result.paths) {
            console.log(chalk.dim(`  Removed: ${p}`))
          }
        } else {
          spinner.warn(`Nothing to remove for "${agentName}"`)
        }
      } catch (error: any) {
        spinner.fail("Uninstall failed")
        console.error(chalk.red(error.message))
        process.exit(1)
      }
    })
}
