import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "fs"
import { basename, join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiPost, apiFormData } from "../utils/api.js"
import { requireAuth } from "../utils/config.js"
import { openclawAdapter } from "../platforms/openclaw/adapter.js"
import { parseSkillMd } from "../utils/skill.js"
import {
  buildLocalSnapshot,
  computeHashFromSnapshot,
  findLocalAvatar,
  findAgentAvatar,
  readResourcesMeta,
  readSyncState,
  writeSyncState,
} from "../utils/sync.js"
import type {
  SyncPushResponse,
  AvatarUploadResponse,
  ResourcesUploadResponse,
} from "../types/sync.js"

function mimeFromExtension(ext: string): string {
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
  }
  return map[ext.toLowerCase()] ?? "application/octet-stream"
}

export const pushCommand = new Command("push")
  .description("Push your agent package to the Web42 marketplace")
  .option("--force", "Skip hash comparison and always push")
  .option("--force-avatar", "Explicitly upload avatar even if no other changes")
  .action(async (opts: { force?: boolean; forceAvatar?: boolean }) => {
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

    // -----------------------------------------------------------------------
    // Step 1: Pack into .web42/dist/
    // -----------------------------------------------------------------------
    const distDir = join(cwd, ".web42", "dist")

    if (existsSync(distDir)) {
      spinner.text = "Reading packed artifact from .web42/dist/..."
      const packedManifestPath = join(distDir, "manifest.json")
      if (existsSync(packedManifestPath)) {
        manifest = JSON.parse(readFileSync(packedManifestPath, "utf-8"))
      }
    } else {
      spinner.text = "Packing agent into .web42/dist/..."
      const result = await openclawAdapter.pack({
        cwd,
        outputDir: ".web42/dist",
      })

      const internalPrefixes: string[] = []
      for (const f of result.files) {
        const skillMatch = f.path.match(/^skills\/([^/]+)\/SKILL\.md$/)
        if (skillMatch) {
          const parsed = parseSkillMd(f.content, skillMatch[1])
          if (parsed.internal)
            internalPrefixes.push(`skills/${skillMatch[1]}/`)
        }
      }
      if (internalPrefixes.length > 0) {
        result.files = result.files.filter(
          (f) => !internalPrefixes.some((p) => f.path.startsWith(p))
        )
      }

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

      mkdirSync(distDir, { recursive: true })
      for (const file of result.files) {
        const filePath = join(distDir, file.path)
        mkdirSync(join(filePath, ".."), { recursive: true })
        writeFileSync(filePath, file.content, "utf-8")
      }
      writeFileSync(
        join(distDir, "manifest.json"),
        JSON.stringify(manifest, null, 2) + "\n"
      )
    }

    // -----------------------------------------------------------------------
    // Step 2: Resolve agent ID (create if first push)
    // -----------------------------------------------------------------------
    spinner.text = "Resolving agent..."

    let syncState = readSyncState(cwd)
    let agentId = syncState?.agent_id ?? null
    let isCreated = false

    if (!agentId) {
      let readme = ""
      const readmePath = join(cwd, "README.md")
      if (existsSync(readmePath)) {
        readme = readFileSync(readmePath, "utf-8")
      }

      let profile_image_data = undefined
      // Check for avatar/avatar.png or avatars/avatar.png
      const avatarSearchPaths = [
        join(cwd, "avatar/avatar.png"),
        join(cwd, "avatars/avatar.png"),
        join(cwd, "avatar.png"),
        // Also check .web42/ for the one managed by build/pack
        join(cwd, ".web42/avatar.png"),
      ]

      for (const ap of avatarSearchPaths) {
        if (existsSync(ap)) {
          try {
            const stats = statSync(ap)
            if (stats.size <= 5 * 1024 * 1024) {
              profile_image_data = readFileSync(ap).toString("base64")
              break
            }
          } catch (e) {
            // Skip
          }
        }
      }

      const agentResult = await apiPost<{
        agent: { id: string }
        created?: boolean
        hash?: string
      }>("/api/agents", {
        slug: manifest.name,
        name: manifest.name,
        description: manifest.description ?? "",
        readme,
        manifest,
        demo_video_url: manifest.demoVideoUrl,
        profile_image_data,
      })

      agentId = agentResult.agent.id
      isCreated = !!agentResult.created
    }

    // -----------------------------------------------------------------------
    // Step 3: Build local snapshot and compute hash
    // -----------------------------------------------------------------------
    spinner.text = "Building snapshot..."
    const snapshot = buildLocalSnapshot(cwd)

    const localHash = computeHashFromSnapshot(snapshot)

    // -----------------------------------------------------------------------
    // Step 4: Compare local hash with last known local hash (unless --force)
    // -----------------------------------------------------------------------
    if (!opts.force && !opts.forceAvatar && !isCreated && syncState?.last_local_hash) {
      if (localHash === syncState.last_local_hash) {
        spinner.succeed(
          `${chalk.bold(`@${config.username}/${manifest.name}`)} has no local changes since last sync.`
        )
        return
      }
    }

    // -----------------------------------------------------------------------
    // Step 5: Push snapshot
    // -----------------------------------------------------------------------
    spinner.text = `Pushing ${snapshot.files.length} files...`

    try {
      const pushResult = await apiPost<SyncPushResponse>(
        `/api/agents/${agentId}/sync/push`,
        snapshot
      )

      let finalHash = pushResult.hash

      // -------------------------------------------------------------------
      // Step 6: Upload avatar if present
      // -------------------------------------------------------------------
      const avatarPath = findLocalAvatar(cwd) || findAgentAvatar(cwd)
      if (avatarPath) {
        spinner.text = "Uploading avatar..."
        const ext = avatarPath.split(".").pop() ?? "png"
        const avatarBuffer = readFileSync(avatarPath)
        const avatarBlob = new Blob([avatarBuffer], {
          type: mimeFromExtension(ext),
        })
        const avatarForm = new FormData()
        avatarForm.append("avatar", avatarBlob, `avatar.${ext}`)

        const avatarResult = await apiFormData<AvatarUploadResponse>(
          `/api/agents/${agentId}/sync/avatar`,
          avatarForm
        )
        finalHash = avatarResult.hash
      }

      // -------------------------------------------------------------------
      // Step 7: Upload resources if present
      // -------------------------------------------------------------------
      const resourcesMeta = readResourcesMeta(cwd)
      if (resourcesMeta.length > 0) {
        spinner.text = "Uploading resources..."
        const resForm = new FormData()

        const metadataForApi = resourcesMeta.map((meta, i) => ({
          file_key: `resource_${i}`,
          title: meta.title,
          description: meta.description,
          type: meta.type,
          sort_order: meta.sort_order,
        }))
        resForm.append("metadata", JSON.stringify(metadataForApi))

        for (let i = 0; i < resourcesMeta.length; i++) {
          const meta = resourcesMeta[i]
          const resFilePath = join(cwd, ".web42", "resources", meta.file)
          if (existsSync(resFilePath)) {
            const resBuffer = readFileSync(resFilePath)
            const ext = meta.file.split(".").pop() ?? ""
            const blob = new Blob([resBuffer], {
              type: mimeFromExtension(ext),
            })
            resForm.append(`resource_${i}`, blob, meta.file)
          }
        }

        const resResult = await apiFormData<ResourcesUploadResponse>(
          `/api/agents/${agentId}/sync/resources`,
          resForm
        )
        finalHash = resResult.hash
      }

      // -------------------------------------------------------------------
      // Step 8: Save sync state
      // -------------------------------------------------------------------
      writeSyncState(cwd, {
        agent_id: agentId,
        last_remote_hash: finalHash,
        last_local_hash: localHash,
        synced_at: new Date().toISOString(),
      })

      spinner.succeed(
        `Pushed ${chalk.bold(`@${config.username}/${manifest.name}`)} (${snapshot.files.length} files)`
      )

      if (isCreated) {
        console.log(chalk.green("  New agent created!"))
      } else {
        console.log(chalk.green("  Agent updated."))
      }

      console.log(
        chalk.dim(
          `  View at: ${config.apiUrl ? config.apiUrl.replace("https://", "") : "web42.ai"}/${config.username}/${manifest.name}`
        )
      )
      console.log(chalk.dim(`  Sync hash: ${finalHash.slice(0, 12)}...`))
    } catch (error: any) {
      spinner.fail("Push failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
