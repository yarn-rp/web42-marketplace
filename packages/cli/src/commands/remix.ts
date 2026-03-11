import { Command } from "commander"
import chalk from "chalk"
import inquirer from "inquirer"
import ora from "ora"

import { apiGet, apiPost } from "../utils/api.js"
import { requireAuth } from "../utils/config.js"

export const remixCommand = new Command("remix")
  .description("Remix an agent package to your account")
  .argument("<agent>", "Agent to remix (e.g. @user/agent-name)")
  .action(async (agentRef: string) => {
    const config = requireAuth()

    const match = agentRef.match(/^@?([^/]+)\/(.+)$/)
    if (!match) {
      console.log(
        chalk.red("Invalid agent reference. Use @user/agent-name format.")
      )
      process.exit(1)
    }

    const [, username, agentSlug] = match

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Remix @${username}/${agentSlug} to @${config.username}/${agentSlug}?`,
        default: true,
      },
    ])

    if (!confirm) {
      console.log(chalk.yellow("Aborted."))
      return
    }

    const spinner = ora("Remixing...").start()

    try {
      // Find the agent
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

      await apiPost(`/api/agents/${agent.id}/remix`, {})

      spinner.succeed(
        `Remixed to ${chalk.bold(`@${config.username}/${agentSlug}`)}`
      )
      console.log()
      console.log(
        chalk.dim(
          `Run \`web42 install @${config.username}/${agentSlug}\` to install locally.`
        )
      )
    } catch (error: any) {
      spinner.fail("Remix failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
