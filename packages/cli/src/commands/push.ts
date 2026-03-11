import { createHash } from "crypto"
import { readFileSync, existsSync, statSync } from "fs"
import { join, relative } from "path"
import { Command } from "commander"
import chalk from "chalk"
import { glob } from "glob"
import ora from "ora"

import { apiPost } from "../utils/api.js"
import { requireAuth } from "../utils/config.js"

const HARDCODED_EXCLUDES = [
  "auth-profiles.json",
  "MEMORY.md",
  "memory/**",
  "sessions/**",
  ".git/**",
  "node_modules/**",
  ".DS_Store",
  "*.log",
]

const TEMPLATE_VARS: Array<[RegExp, string]> = [
  [/\/Users\/[^/]+\/.openclaw/g, "{{OPENCLAW_HOME}}"],
  [/\/home\/[^/]+\/.openclaw/g, "{{OPENCLAW_HOME}}"],
  [/C:\\Users\\[^\\]+\\.openclaw/g, "{{OPENCLAW_HOME}}"],
]

function sanitizeContent(content: string): string {
  let result = content
  for (const [pattern, replacement] of TEMPLATE_VARS) {
    result = result.replace(pattern, replacement)
  }
  return result
}

function hashFile(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

export const pushCommand = new Command("push")
  .description("Push your agent package to the Web42 marketplace")
  .action(async () => {
    const config = requireAuth()
    const cwd = process.cwd()
    const manifestPath = join(cwd, "manifest.json")

    if (!existsSync(manifestPath)) {
      console.log(
        chalk.red("No manifest.json found. Run `web42 init` first.")
      )
      process.exit(1)
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))

    // Validate manifest
    if (!manifest.name || !manifest.version || !manifest.author) {
      console.log(
        chalk.red(
          "Invalid manifest.json. Must have name, version, and author."
        )
      )
      process.exit(1)
    }

    const spinner = ora("Scanning workspace...").start()

    // Build ignore patterns
    const ignorePatterns = [...HARDCODED_EXCLUDES]
    const web42ignorePath = join(cwd, ".web42ignore")
    if (existsSync(web42ignorePath)) {
      const ignoreContent = readFileSync(web42ignorePath, "utf-8")
      ignoreContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .forEach((pattern) => ignorePatterns.push(pattern))
    }

    // Scan files
    const allFiles = await glob("**/*", {
      cwd,
      nodir: true,
      ignore: ignorePatterns,
      dot: true,
    })

    spinner.text = `Found ${allFiles.length} files. Processing...`

    // Read and process files
    const processedFiles: Array<{
      path: string
      content: string
      hash: string
    }> = []

    for (const filePath of allFiles) {
      const fullPath = join(cwd, filePath)
      const stat = statSync(fullPath)

      // Skip files larger than 1MB
      if (stat.size > 1024 * 1024) {
        console.log(chalk.yellow(`  Skipping ${filePath} (>1MB)`))
        continue
      }

      try {
        let content = readFileSync(fullPath, "utf-8")
        content = sanitizeContent(content)
        const hash = hashFile(content)
        processedFiles.push({ path: filePath, content, hash })
      } catch {
        // Skip binary files
      }
    }

    spinner.text = `Pushing ${processedFiles.length} files...`

    // Read README if present
    let readme = ""
    const readmePath = join(cwd, "README.md")
    if (existsSync(readmePath)) {
      readme = readFileSync(readmePath, "utf-8")
    }

    try {
      // Create or update the agent
      const agentResult = await apiPost<{
        agent: { id: string }
        created?: boolean
        updated?: boolean
      }>("/api/agents", {
        slug: manifest.name,
        name: manifest.name,
        description: manifest.description,
        readme,
        manifest,
        demo_video_url: manifest.demoVideoUrl,
      })

      const agentId = agentResult.agent.id

      const fileEntries = processedFiles.map((f) => ({
        path: f.path,
        content: f.content,
        content_hash: f.hash,
        storage_url: `agent-files/${config.username}/${manifest.name}/${f.path}`,
      }))

      await apiPost(`/api/agents/${agentId}/files`, { files: fileEntries })

      spinner.succeed(
        `Pushed ${chalk.bold(`@${config.username}/${manifest.name}`)} (${processedFiles.length} files)`
      )

      if (agentResult.created) {
        console.log(chalk.green("  New agent created!"))
      } else {
        console.log(chalk.green("  Agent updated."))
      }

      console.log(
        chalk.dim(
          `  View at: ${config.apiUrl ? config.apiUrl.replace("https://", "") : "agents.web42.ai"}/${config.username}/${manifest.name}`
        )
      )
    } catch (error: any) {
      spinner.fail("Push failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
