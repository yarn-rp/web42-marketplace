import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiGet } from "../utils/api.js"

interface AgentResult {
  id: string
  slug: string
  name: string
  description: string
  stars_count: number
  price_cents: number
  manifest?: {
    platform?: string
  }
  owner: {
    username: string
  }
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1) + "\u2026"
}

export const searchCommand = new Command("search")
  .description("Search the marketplace for agents")
  .argument("<query>", "Search query")
  .option(
    "-p, --platform <platform>",
    "Filter results by platform (e.g. openclaw)"
  )
  .option("-l, --limit <number>", "Max results to show", "10")
  .action(
    async (
      query: string,
      opts: { platform?: string; limit: string }
    ) => {
      const spinner = ora(`Searching for "${query}"...`).start()

      try {
        const agents = await apiGet<AgentResult[]>(
          `/api/agents?search=${encodeURIComponent(query)}`
        )

        spinner.stop()

        if (agents.length === 0) {
          console.log(chalk.yellow(`No agents found for "${query}".`))
          return
        }

        const limit = parseInt(opts.limit, 10) || 10
        const results = agents.slice(0, limit)

        console.log(
          chalk.bold(`Found ${agents.length} agent(s) for "${query}":`)
        )
        console.log()

        for (const agent of results) {
          const ref = `@${agent.owner.username}/${agent.slug}`
          const stars =
            agent.stars_count > 0 ? chalk.yellow(` \u2605 ${agent.stars_count}`) : ""
          const price =
            agent.price_cents > 0
              ? chalk.green(` $${(agent.price_cents / 100).toFixed(2)}`)
              : chalk.dim(" Free")

          console.log(`  ${chalk.cyan.bold(agent.name)}${stars}${price}`)
          console.log(`  ${chalk.dim(ref)}`)
          if (agent.description) {
            console.log(`  ${truncate(agent.description, 80)}`)
          }
          const platform = agent.manifest?.platform ?? "openclaw"
          if (agent.price_cents > 0) {
            const siteUrl = process.env.WEB42_API_URL ?? "https://web42.ai"
            console.log(
              chalk.dim(`  Purchase: ${siteUrl}/${agent.owner.username}/${agent.slug}`)
            )
          } else {
            console.log(
              chalk.dim(`  Install: web42 ${platform} install ${ref}`)
            )
          }
          console.log()
        }

        if (agents.length > limit) {
          console.log(
            chalk.dim(
              `  ... and ${agents.length - limit} more. Use --limit to see more.`
            )
          )
        }
      } catch (error: any) {
        spinner.fail("Search failed")
        console.error(chalk.red(error.message))
        process.exit(1)
      }
    }
  )
