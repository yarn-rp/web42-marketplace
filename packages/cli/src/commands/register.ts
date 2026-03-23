import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { requireAuth, getConfig } from "../utils/config.js"

export const registerCommand = new Command("register")
  .description("Register an agent with the Web42 marketplace")
  .argument("<url>", "Public URL of the running agent (must serve /.well-known/agent-card.json)")
  .option("--price <cents>", "Price in cents (default: 0 = free)")
  .option("--license <license>", "License (e.g. MIT, Apache-2.0)")
  .option("--visibility <vis>", "Visibility: public or private", "public")
  .option("--tags <tags>", "Comma-separated tags")
  .option("--categories <cats>", "Comma-separated categories")
  .action(
    async (
      url: string,
      opts: {
        price?: string
        license?: string
        visibility?: string
        tags?: string
        categories?: string
      }
    ) => {
      const config = requireAuth()
      const web42ApiUrl = config.apiUrl ?? "https://web42.ai"

      const spinner = ora("Registering agent...").start()

      const body: Record<string, unknown> = { url }

      if (opts.price !== undefined) body.price_cents = parseInt(opts.price, 10)
      if (opts.license) body.license = opts.license
      if (opts.visibility) body.visibility = opts.visibility
      if (opts.tags) body.tags = opts.tags.split(",").map((t) => t.trim())
      if (opts.categories) body.categories = opts.categories.split(",").map((c) => c.trim())

      try {
        const res = await fetch(`${web42ApiUrl}/api/agents`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string }
          spinner.fail("Registration failed")
          console.error(chalk.red(errBody.error ?? `HTTP ${res.status}`))
          process.exit(1)
        }

        const data = (await res.json()) as {
          agent?: { slug?: string; agent_card?: { name?: string } }
          created?: boolean
          updated?: boolean
        }

        const slug = data.agent?.slug ?? "unknown"
        const name = data.agent?.agent_card?.name ?? slug
        const displaySlug = slug.replace("~", "/")

        if (data.created) {
          spinner.succeed(`Registered "${name}" (${displaySlug})`)
        } else {
          spinner.succeed(`Updated "${name}" (${displaySlug})`)
        }

        console.log(chalk.dim(`  Send:  web42 send ${slug} "hello"`))
        console.log(chalk.dim(`  View:  ${web42ApiUrl}/${displaySlug.replace("@", "")}`))
      } catch (err) {
        spinner.fail("Registration failed")
        console.error(chalk.red(String(err)))
        process.exit(1)
      }
    }
  )
