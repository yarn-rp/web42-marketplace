import { Command } from "commander"
import chalk from "chalk"

import { getConfig, setApiUrl } from "../utils/config.js"

export const configCommand = new Command("config").description(
  "View or update CLI configuration"
)

configCommand
  .command("show")
  .description("Show the current configuration")
  .action(() => {
    const cfg = getConfig()
    console.log(chalk.bold("Web42 CLI Configuration"))
    console.log()
    console.log(`  API URL:        ${chalk.cyan(cfg.apiUrl)}`)
    console.log(
      `  Authenticated:  ${cfg.authenticated ? chalk.green("yes") : chalk.yellow("no")}`
    )
    if (cfg.username) {
      console.log(`  User:           ${chalk.cyan(`@${cfg.username}`)}`)
    }
    if (cfg.fullName) {
      console.log(`  Name:           ${cfg.fullName}`)
    }
  })

configCommand
  .command("set-url <url>")
  .description("Persistently set the API URL (e.g. http://localhost:3000)")
  .action((url: string) => {
    setApiUrl(url)
    console.log(chalk.green(`API URL set to ${chalk.bold(url)}`))
  })
