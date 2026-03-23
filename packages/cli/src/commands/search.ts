import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiGet } from "../utils/api.js"

interface AgentCardJSON {
  name?: string
  description?: string
  securitySchemes?: Record<string, { type: string; scheme?: string }>
  security?: Array<Record<string, unknown>>
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

function getSecurityLevel(card: AgentCardJSON | null | undefined): string {
  const security = card?.security
  if (!security || security.length === 0) return "🔓 Public"
  const schemeName = Object.keys(security[0])[0]
  if (!schemeName) return "🔓 Public"
  if (schemeName === "Web42Bearer") return "🔐 Web42 Auth"
  return `🔐 ${schemeName}`
}

function terminalLink(text: string, url: string): string {
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`
}

function wrapText(text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = []
  let currentLine = ""

  const words = text.split(/\s+/)

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word
    } else if ((currentLine + " " + word).length <= maxWidth) {
      currentLine += " " + word
    } else {
      lines.push(currentLine)
      currentLine = word

      if (lines.length >= maxLines) {
        break
      }
    }
  }

  if (currentLine.length > 0) {
    if (lines.length >= maxLines) {
      if (lines[lines.length - 1].length + 1 + currentLine.length > maxWidth) {
        lines[lines.length - 1] = lines[lines.length - 1].slice(0, maxWidth - 1) + "\u2026"
      } else {
        lines[lines.length - 1] += " " + currentLine
      }
    } else {
      lines.push(currentLine)
    }
  }

  return lines.slice(0, maxLines)
}

function printAsciiLogo(): void {
  const logo = chalk.bold.white(
    `█ █  ███  ███  ███  ███ \n` +
    `█ █ █   █ █    █    █   \n` +
    `███ █   █ █ ██ █ ██  ██ \n` +
    `█ █ █   █ █  █ █  █    █\n` +
    `█ █  ███  ███  ███  ███ `
  )
  console.log(logo)
  console.log()
}

function printGlobalHint(): void {
  const hint = `  Talk to any agent with  ${chalk.cyan(`npx web42 send <owner/agent> "your message"`)}`
  console.log(hint)
  console.log()
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

        printAsciiLogo()
        printGlobalHint()

        for (const agent of results) {
          const name = getCardName(agent.agent_card)
          const description = getCardDescription(agent.agent_card)
          const username = agent.owner.username
          const security = getSecurityLevel(agent.agent_card)
          const stars = agent.stars_count > 0 ? `★ ${agent.stars_count}` : ""

          // Header: - <name (link)> | <@username (link)> | <security> | <stars>
          const nameLink = chalk.bold.cyan(
            terminalLink(name, `https://web42.ai/${username}/${agent.slug.split("~")[1] ?? agent.slug}`)
          )
          const usernameLink = chalk.dim(
            terminalLink(`@${username}`, `https://web42.ai/${username}`)
          )
          const separator = chalk.dim(" | ")
          const headerParts = [nameLink, usernameLink, security]
          if (stars) headerParts.push(chalk.yellow(stars))

          console.log(`- ${headerParts.join(separator)}`)

          // Description (2 lines max, 72 chars wide)
          if (description) {
            const wrapped = wrapText(description, 72, 2)
            for (const line of wrapped) {
              console.log(`  ${line}`)
            }
          }

          // Send command
          console.log(`  ${chalk.dim("└")} ${chalk.cyan(`npx web42 send ${agent.slug} "hello"`)}`)
          console.log()
        }

        if (agents.length > limit) {
          console.log(
            chalk.dim(`  ... and ${agents.length - limit} more. Use --limit to see more.`)
          )
        }
      } catch (error: unknown) {
        spinner.fail("Search failed")
        console.error(chalk.red(String(error)))
        process.exit(1)
      }
    }
  )
