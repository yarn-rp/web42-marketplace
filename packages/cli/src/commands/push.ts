import { createHash } from "crypto"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs"
import { join, relative } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiPost } from "../utils/api.js"
import { requireAuth } from "../utils/config.js"
import { openclawAdapter } from "../platforms/openclaw/adapter.js"

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

function readPackedFiles(
  dir: string
): Array<{ path: string; content: string; hash: string }> {
  const files: Array<{ path: string; content: string; hash: string }> = []

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else {
        if (entry.name === "manifest.json" && currentDir === dir) continue
        const stat = statSync(fullPath)
        if (stat.size > 1024 * 1024) continue
        try {
          const content = readFileSync(fullPath, "utf-8")
          const relPath = relative(dir, fullPath)
          files.push({ path: relPath, content, hash: hashContent(content) })
        } catch {
          // Skip binary files
        }
      }
    }
  }

  walk(dir)
  return files
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

    let manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))

    if (!manifest.name || !manifest.version || !manifest.author) {
      console.log(
        chalk.red(
          "Invalid manifest.json. Must have name, version, and author."
        )
      )
      process.exit(1)
    }

    const spinner = ora("Preparing agent package...").start()

    const web42Dir = join(cwd, ".web42")
    let processedFiles: Array<{ path: string; content: string; hash: string }>

    if (existsSync(web42Dir)) {
      spinner.text = "Reading packed artifact..."
      processedFiles = readPackedFiles(web42Dir)

      const packedManifestPath = join(web42Dir, "manifest.json")
      if (existsSync(packedManifestPath)) {
        manifest = JSON.parse(readFileSync(packedManifestPath, "utf-8"))
      }
    } else {
      spinner.text = "No .web42/ found, packing automatically..."
      const result = await openclawAdapter.pack({ cwd, outputDir: ".web42" })
      processedFiles = result.files

      const existingKeys = new Set(
        (manifest.configVariables ?? []).map((v: { key: string }) => v.key)
      )
      for (const cv of result.configVariables) {
        if (!existingKeys.has(cv.key)) {
          if (!manifest.configVariables) manifest.configVariables = []
          manifest.configVariables.push(cv)
          existingKeys.add(cv.key)
        }
      }

      // Write the packed artifact so it can be inspected later
      mkdirSync(web42Dir, { recursive: true })
      for (const file of result.files) {
        const filePath = join(web42Dir, file.path)
        mkdirSync(join(filePath, ".."), { recursive: true })
        writeFileSync(filePath, file.content, "utf-8")
      }
      writeFileSync(
        join(web42Dir, "manifest.json"),
        JSON.stringify(manifest, null, 2) + "\n"
      )
    }

    spinner.text = `Pushing ${processedFiles.length} files...`

    let readme = ""
    const readmePath = join(cwd, "README.md")
    if (existsSync(readmePath)) {
      readme = readFileSync(readmePath, "utf-8")
    }

    let profile_image_data: string | undefined = undefined

    // Agent profile avatar (binary) is handled explicitly, since the packed-files
    // flow skips binaries.
    const avatarCandidates = [
      join(cwd, "avatar/avatar.png"),
      join(cwd, "avatars/avatar.png"),
      join(cwd, "avatar.png"),
    ]

    let avatarPath: string | undefined
    for (const candidate of avatarCandidates) {
      if (existsSync(candidate)) {
        avatarPath = candidate
        break
      }
    }

    if (avatarPath) {
      const stat = statSync(avatarPath)
      if (stat.size > 2 * 1024 * 1024) {
        throw new Error(
          `Avatar too large (max 2MB): ${relative(cwd, avatarPath)}`
        )
      }
      profile_image_data = readFileSync(avatarPath).toString("base64")
    }

    try {
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
        profile_image_data,
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
