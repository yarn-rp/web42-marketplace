import { writeFileSync, existsSync } from "fs"
import { join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import inquirer from "inquirer"

import { requireAuth } from "../utils/config.js"

const CATEGORIES = [
  "Customer Support",
  "Healthcare",
  "Developer Tools",
  "Personal Assistant",
  "Sales",
  "Marketing",
  "Education",
  "Finance",
  "Content Creation",
  "Productivity",
]

export const initCommand = new Command("init")
  .description("Create a manifest.json for your agent package")
  .action(async () => {
    const config = requireAuth()
    const cwd = process.cwd()
    const manifestPath = join(cwd, "manifest.json")

    if (existsSync(manifestPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: "manifest.json already exists. Overwrite?",
          default: false,
        },
      ])
      if (!overwrite) {
        console.log(chalk.yellow("Aborted."))
        return
      }
    }

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Agent name (lowercase, hyphens allowed):",
        validate: (val: string) =>
          /^[a-z0-9][a-z0-9-]*$/.test(val) ||
          "Must be lowercase alphanumeric with hyphens",
      },
      {
        type: "input",
        name: "description",
        message: "Short description:",
        validate: (val: string) =>
          val.length > 0 && val.length <= 500 || "1-500 characters",
      },
      {
        type: "input",
        name: "version",
        message: "Version:",
        default: "1.0.0",
        validate: (val: string) =>
          /^\d+\.\d+\.\d+$/.test(val) || "Must follow semver (e.g. 1.0.0)",
      },
      {
        type: "list",
        name: "category",
        message: "Primary category:",
        choices: CATEGORIES,
      },
      {
        type: "input",
        name: "tags",
        message: "Tags (comma-separated):",
        filter: (val: string) =>
          val
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
      },
      {
        type: "input",
        name: "channels",
        message: "Supported channels (comma-separated, e.g. discord,slack,web):",
        filter: (val: string) =>
          val
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
      },
      {
        type: "input",
        name: "primaryModel",
        message: "Primary model preference (e.g. claude-sonnet-4-20250514):",
        default: "",
      },
      {
        type: "input",
        name: "demoVideoUrl",
        message: "Demo video URL (optional):",
        default: "",
      },
    ])

    const manifest = {
      name: answers.name,
      description: answers.description,
      version: answers.version,
      author: config.username,
      channels: answers.channels,
      skills: [] as string[],
      plugins: [] as string[],
      modelPreferences: answers.primaryModel
        ? { primary: answers.primaryModel }
        : undefined,
      tags: answers.tags,
      demoVideoUrl: answers.demoVideoUrl || undefined,
      configVariables: [] as Array<{
        key: string
        label: string
        required: boolean
      }>,
    }

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
    console.log()
    console.log(chalk.green(`Created ${chalk.bold("manifest.json")}`))
    console.log(chalk.dim("Run `web42 push` to publish your agent package."))
  })
