import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiGet } from "../utils/api.js"

interface AgentCardJSON {
  name?: string
  description?: string
  capabilities?: {
    extensions?: Array<{
      uri: string
      params?: Record<string, unknown>
    }>
  }
}

interface AgentResult {
  id: string
  slug: string
  agent_card: AgentCardJSON
  stars_count: number
  interactions_count: number
  owner: {
    username: string
  }
}

function getCardName(card: AgentCardJSON | null | undefined): string {
  return card?.name ?? "Untitled Agent"
}

function getCardDescription(card: AgentCardJSON | null | undefined): string {
  return card?.description ?? ""
}

function getMarketplacePrice(card: AgentCardJSON | null | undefined): number {
  const ext = card?.capabilities?.extensions?.find(
    (e) => e.uri === "https://web42.ai/ext/marketplace/v1"
  )
  return (ext?.params?.price_cents as number) ?? 0
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1) + "\u2026"
}

export const searchCommand = new Command("search")
  .description("Search the marketplace for agents")
  .argument("<query>", "Search query")
  .option("-l, --limit <number>", "Max results to show", "10")
  .action(
    async (
      query: string,
      opts: { limit: string }
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
          const name = getCardName(agent.agent_card)
          const description = getCardDescription(agent.agent_card)
          const priceCents = getMarketplacePrice(agent.agent_card)
          const ref = `@${agent.owner.username}/${agent.slug}`
          const stars =
            agent.stars_count > 0 ? chalk.yellow(` \u2605 ${agent.stars_count}`) : ""
          const price =
            priceCents > 0
              ? chalk.green(` $${(priceCents / 100).toFixed(2)}`)
              : chalk.dim(" Free")

          console.log(`  ${chalk.cyan.bold(name)}${stars}${price}`)
          console.log(`  ${chalk.dim(ref)}`)
          if (description) {
            console.log(`  ${truncate(description, 80)}`)
          }
          console.log(
            chalk.dim(`  Send: web42 send ${agent.slug} "hello"`)
          )
          console.log()
        }

        if (agents.length > limit) {
          console.log(
            chalk.dim(
              `  ... and ${agents.length - limit} more. Use --limit to see more.`
            )
          )
        }
      } catch (error: unknown) {
        spinner.fail("Search failed")
        console.error(chalk.red(String(error)))
        process.exit(1)
      }
    }
  )
