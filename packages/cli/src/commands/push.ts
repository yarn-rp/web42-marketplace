import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, readdirSync } from "fs"
import path, { basename, join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiPost, apiFormData } from "../utils/api.js"
import { requireAuth } from "../utils/config.js"
import { resolvePlatform } from "../platforms/registry.js"
import { parseSkillMd } from "../utils/skill.js"
import {
  buildLocalSnapshot,
  computeHashFromSnapshot,
  findLocalAvatar,
  findAgentAvatar,
  discoverResources,
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

/**
 * Push a single agent to the marketplace.
 * This encapsulates steps 1-8 of the push flow.
 */
async function pushSingleAgent(opts: {
  cwd: string
  manifest: Record<string, unknown>
  distDir: string
  syncDir: string // where sync.json lives (e.g., cwd or .web42/{agentName}/)
  config: { username?: string; apiUrl?: string }
  force?: boolean
  forceAvatar?: boolean
  spinner: ReturnType<typeof ora>
  adapter: ReturnType<typeof resolvePlatform>
  agentName?: string
}): Promise<void> {
  const { cwd, config, spinner, distDir, syncDir } = opts
  let manifest = opts.manifest

  // -----------------------------------------------------------------------
  // Step 1: Pack into dist/ (if not already packed)
  // -----------------------------------------------------------------------
  if (existsSync(distDir)) {
    const packedManifestPath = join(distDir, "manifest.json")
    if (existsSync(packedManifestPath)) {
      manifest = JSON.parse(readFileSync(packedManifestPath, "utf-8"))
    }
  } else {
    spinner.text = `Packing ${opts.agentName ?? "agent"}...`
    const result = await opts.adapter.pack({
      cwd,
      outputDir: distDir.startsWith(cwd) ? distDir.slice(cwd.length + 1) : distDir,
      agentName: opts.agentName,
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

    const configVars = Array.isArray(manifest.configVariables) ? manifest.configVariables : []
    const existingKeys = new Set(
      configVars.map((v: { key: string }) => v.key)
    )
    for (const cv of result.configVariables) {
      if (!existingKeys.has(cv.key)) {
        if (!manifest.configVariables) manifest.configVariables = []
        ;(manifest.configVariables as Array<unknown>).push(cv)
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
  spinner.text = `Resolving ${opts.agentName ?? "agent"}...`

  let syncState = readSyncState(syncDir)
  let agentId = syncState?.agent_id ?? null
  let isCreated = false

  // Always resolve agent metadata (README, marketplace config, avatar)
  // and upsert the agent record so metadata updates propagate on every push.
  {
    let readme = ""
    // Check per-agent README first (syncDir/README.md), then cwd/README.md
    const agentReadmePath = join(syncDir, "README.md")
    const cwdReadmePath = join(cwd, "README.md")
    if (existsSync(agentReadmePath)) {
      readme = readFileSync(agentReadmePath, "utf-8")
    } else if (existsSync(cwdReadmePath)) {
      readme = readFileSync(cwdReadmePath, "utf-8")
    }

    // Note: visibility, license, price, and tags are managed exclusively
    // through the dashboard UI — the CLI never sends these fields.

    let profile_image_data = undefined
    if (!agentId) {
      // Only upload avatar on first push (subsequent avatar updates use step 6)
      const avatarSearchPaths = [
        join(cwd, "avatar/avatar.png"),
        join(cwd, "avatars/avatar.png"),
        join(cwd, "avatar.png"),
        join(syncDir, "avatar.png"),
      ]

      for (const ap of avatarSearchPaths) {
        if (existsSync(ap)) {
          try {
            const stats = statSync(ap)
            if (stats.size <= 5 * 1024 * 1024) {
              profile_image_data = readFileSync(ap).toString("base64")
              break
            }
          } catch {
            // Skip
          }
        }
      }
    }

    const name = (manifest.name as string) ?? ""
    const agentResult = await apiPost<{
      agent: { id: string }
      created?: boolean
      hash?: string
    }>("/api/agents", {
      slug: name,
      name,
      description: (manifest.description as string) ?? "",
      readme,
      manifest,
      demo_video_url: (manifest as Record<string, unknown>).demoVideoUrl,
      profile_image_data,
    })

    agentId = agentResult.agent.id
    isCreated = !!agentResult.created
  }

  // -----------------------------------------------------------------------
  // Step 3: Build local snapshot and compute hash
  // -----------------------------------------------------------------------
  spinner.text = "Building snapshot..."
  // Determine whether syncDir is a .web42 subdirectory using path semantics,
  // not string matching (avoids false positives when project path itself contains ".web42").
  const relSyncDir = path.relative(cwd, syncDir)
  const syncDirIsWeb42Subdir =
    Boolean(relSyncDir) &&
    !relSyncDir.startsWith("..") &&
    !path.isAbsolute(relSyncDir) &&
    relSyncDir.split(path.sep).includes(".web42")

  const snapshot = buildLocalSnapshot(syncDirIsWeb42Subdir ? syncDir : cwd, distDir)

  const localHash = computeHashFromSnapshot(snapshot)

  // -----------------------------------------------------------------------
  // Step 4: Compare hashes (unless --force)
  // -----------------------------------------------------------------------
  const name = (manifest.name as string) ?? ""
  if (!opts.force && !opts.forceAvatar && !isCreated && syncState?.last_local_hash) {
    if (localHash === syncState.last_local_hash) {
      spinner.succeed(
        `${chalk.bold(`@${config.username}/${name}`)} has no local changes since last sync.`
      )
      return
    }
  }

  // -----------------------------------------------------------------------
  // Step 5: Push snapshot
  // -----------------------------------------------------------------------
  spinner.text = `Pushing ${snapshot.files.length} files...`

  const pushResult = await apiPost<SyncPushResponse>(
    `/api/agents/${agentId}/sync/push`,
    snapshot
  )

  let finalHash = pushResult.hash

  // -----------------------------------------------------------------------
  // Step 6: Upload avatar if present
  // -----------------------------------------------------------------------
  const avatarPath = findLocalAvatar(syncDir) || findAgentAvatar(cwd)
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

  // -----------------------------------------------------------------------
  // Step 7: Upload resources if present
  // -----------------------------------------------------------------------
  const resourcesMeta = readResourcesMeta(syncDir)
  const discoveredResources = discoverResources(cwd)
  const allResources = [...resourcesMeta, ...discoveredResources]

  if (allResources.length > 0) {
    spinner.text = "Uploading resources..."
    const resForm = new FormData()

    const metadataForApi = allResources.map((meta, i) => ({
      file_key: `resource_${i}`,
      title: meta.title,
      description: meta.description,
      type: meta.type,
      sort_order: meta.sort_order,
    }))
    resForm.append("metadata", JSON.stringify(metadataForApi))

    for (let i = 0; i < allResources.length; i++) {
      const meta = allResources[i]
      let resFilePath = join(syncDir, "resources", meta.file)
      if (!existsSync(resFilePath)) {
        resFilePath = join(cwd, ".web42", "resources", meta.file)
      }
      if (!existsSync(resFilePath)) {
        resFilePath = join(cwd, "resources", meta.file)
      }

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

  // -----------------------------------------------------------------------
  // Step 8: Save sync state
  // -----------------------------------------------------------------------
  writeSyncState(syncDir, {
    agent_id: agentId,
    last_remote_hash: finalHash,
    last_local_hash: localHash,
    synced_at: new Date().toISOString(),
  })

  const siteUrl = config.apiUrl ? config.apiUrl.replace("https://", "") : "web42.ai"

  if (isCreated) {
    console.log(chalk.green(`  New agent created: @${config.username}/${name}`))
  } else {
    console.log(chalk.green(`  Updated: @${config.username}/${name}`))
  }
  console.log(chalk.dim(`  View at: ${siteUrl}/${config.username}/${name}`))
  console.log(chalk.dim(`  Sync hash: ${finalHash.slice(0, 12)}...`))
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const pushCommand = new Command("push")
  .description("Push your agent package to the Web42 marketplace")
  .option("--force", "Skip hash comparison and always push")
  .option("--force-avatar", "Explicitly upload avatar even if no other changes")
  .option("--agent <name>", "Push a specific agent (for multi-agent workspaces)")
  .action(async (opts: { force?: boolean; forceAvatar?: boolean; agent?: string }) => {
    const config = requireAuth()
    const cwd = process.cwd()

    // Detect multi-agent workspace (per-agent manifests in .web42/{name}/)
    const web42Dir = join(cwd, ".web42")
    const agentManifests = new Map<string, Record<string, unknown>>()
    let platform = "openclaw"

    if (existsSync(web42Dir)) {
      try {
        const entries = readdirSync(web42Dir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          const agentManifestPath = join(web42Dir, entry.name, "manifest.json")
          if (existsSync(agentManifestPath)) {
            try {
              const m = JSON.parse(readFileSync(agentManifestPath, "utf-8"))
              agentManifests.set(entry.name, m)
              if (m.platform) platform = m.platform
            } catch {
              // skip
            }
          }
        }
      } catch {
        // .web42 not readable
      }
    }

    const isMultiAgent = agentManifests.size > 0

    // Single-agent mode (e.g., OpenClaw)
    if (!isMultiAgent) {
      const manifestPath = join(cwd, "manifest.json")
      if (!existsSync(manifestPath)) {
        console.log(chalk.red("No manifest.json found. Run `web42 init` first."))
        process.exit(1)
      }

      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
      if (!manifest.name || !manifest.version || !manifest.author) {
        console.log(chalk.red("Invalid manifest.json. Must have name, version, and author."))
        process.exit(1)
      }

      if (manifest.platform) platform = manifest.platform
      const adapter = resolvePlatform(platform)
      const spinner = ora("Preparing agent package...").start()

      try {
        await pushSingleAgent({
          cwd,
          manifest,
          distDir: join(cwd, ".web42", "dist"),
          syncDir: cwd,
          config,
          force: opts.force,
          forceAvatar: opts.forceAvatar,
          spinner,
          adapter,
        })

        spinner.succeed(
          `Pushed ${chalk.bold(`@${config.username}/${manifest.name}`)}`
        )
      } catch (error: any) {
        spinner.fail("Push failed")
        console.error(chalk.red(error.message))
        process.exit(1)
      }
      return
    }

    // Multi-agent mode
    const adapter = resolvePlatform(platform)

    let agentsToPush: Array<[string, Record<string, unknown>]>
    if (opts.agent) {
      const manifest = agentManifests.get(opts.agent)
      if (!manifest) {
        console.log(
          chalk.red(
            `Agent "${opts.agent}" not found. Available: ${[...agentManifests.keys()].join(", ")}`
          )
        )
        process.exit(1)
      }
      agentsToPush = [[opts.agent, manifest]]
    } else {
      agentsToPush = [...agentManifests.entries()]
    }

    const spinner = ora(`Pushing ${agentsToPush.length} agent(s)...`).start()

    try {
      let successCount = 0
      for (const [agentName, manifest] of agentsToPush) {
        spinner.text = `Pushing ${agentName}...`

        const agentWeb42Dir = join(web42Dir, agentName)
        const distDir = join(agentWeb42Dir, "dist")

        await pushSingleAgent({
          cwd,
          manifest,
          distDir,
          syncDir: agentWeb42Dir,
          config,
          force: opts.force,
          forceAvatar: opts.forceAvatar,
          spinner,
          adapter,
          agentName,
        })
        successCount++
      }

      spinner.succeed(`Pushed ${successCount} agent(s)`)
    } catch (error: any) {
      spinner.fail("Push failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
