import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiGet } from "../utils/api.js"
import { requireAuth } from "../utils/config.js"
import {
  buildLocalSnapshot,
  computeHashFromSnapshot,
  readSyncState,
  writeSyncState,
  writeMarketplace,
  writeResourcesMeta,
} from "../utils/sync.js"
import type {
  SyncStatusResponse,
  SyncPullResponse,
  ResourceMeta,
} from "../types/sync.js"

interface AgentListItem {
  id: string
  slug: string
  name: string
  manifest: Record<string, unknown>
  owner: { username: string }
}

export const pullCommand = new Command("pull")
  .description(
    "Pull latest agent state from the Web42 marketplace into the current directory"
  )
  .option("--force", "Skip hash comparison and always pull")
  .action(async (opts: { force?: boolean }) => {
    const config = requireAuth()
    const cwd = process.cwd()
    const manifestPath = join(cwd, "manifest.json")

    if (!existsSync(manifestPath)) {
      console.log(
        chalk.red("No manifest.json found. Are you in an agent directory?")
      )
      process.exit(1)
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
    if (!manifest.name) {
      console.log(chalk.red("manifest.json is missing a name field."))
      process.exit(1)
    }

    const spinner = ora(
      `Pulling @${config.username}/${manifest.name}...`
    ).start()

    try {
      // -------------------------------------------------------------------
      // Step 1: Resolve agent ID
      // -------------------------------------------------------------------
      let syncState = readSyncState(cwd)
      let agentId = syncState?.agent_id ?? null

      if (!agentId) {
        spinner.text = "Looking up agent..."
        const agents = await apiGet<AgentListItem[]>(
          `/api/agents?username=${config.username}`
        )
        const agent = agents.find((a) => a.slug === manifest.name)
        if (!agent) {
          spinner.fail(
            `Agent @${config.username}/${manifest.name} not found on the marketplace. Run \`web42 push\` first.`
          )
          process.exit(1)
        }
        agentId = agent.id
      }

      // -------------------------------------------------------------------
      // Step 2: Compare remote hash with last known remote hash (unless --force)
      // -------------------------------------------------------------------
      if (!opts.force && syncState?.last_remote_hash) {
        spinner.text = "Checking remote state..."
        const remote = await apiGet<SyncStatusResponse>(
          `/api/agents/${agentId}/sync`
        )

        if (remote.hash === syncState.last_remote_hash) {
          spinner.succeed(
            `${chalk.bold(`@${config.username}/${manifest.name}`)} is already in sync (no remote changes).`
          )
          return
        }
      }

      // -------------------------------------------------------------------
      // Step 3: Pull full snapshot
      // -------------------------------------------------------------------
      spinner.text = "Downloading snapshot..."
      const pullResult = await apiGet<SyncPullResponse>(
        `/api/agents/${agentId}/sync/pull`
      )
      const { snapshot } = pullResult

      let written = 0

      // -------------------------------------------------------------------
      // Step 4a: Write manifest.json (merge identity into existing manifest)
      // -------------------------------------------------------------------
      const updatedManifest = {
        ...manifest,
        ...snapshot.manifest,
        name: snapshot.identity.slug,
        description: snapshot.identity.description,
      }
      writeFileSync(
        manifestPath,
        JSON.stringify(updatedManifest, null, 2) + "\n"
      )
      written++

      // -------------------------------------------------------------------
      // Step 4b: Write README.md
      // -------------------------------------------------------------------
      if (snapshot.readme) {
        writeFileSync(join(cwd, "README.md"), snapshot.readme, "utf-8")
        written++
      }

      // -------------------------------------------------------------------
      // Step 4c: Write .web42/marketplace.json
      // -------------------------------------------------------------------
      writeMarketplace(cwd, snapshot.marketplace)
      written++

      // -------------------------------------------------------------------
      // Step 4d: Write agent files
      // -------------------------------------------------------------------
      let skipped = 0
      for (const file of snapshot.files) {
        if (file.content === null || file.content === undefined) {
          skipped++
          continue
        }
        if (file.path === ".openclaw/config.json") {
          skipped++
          continue
        }
        const filePath = join(cwd, file.path)
        mkdirSync(dirname(filePath), { recursive: true })
        writeFileSync(filePath, file.content, "utf-8")
        written++
      }

      // -------------------------------------------------------------------
      // Step 4e: Write resources metadata
      // -------------------------------------------------------------------
      if (snapshot.resources.length > 0) {
        const resourcesMeta: ResourceMeta[] = snapshot.resources.map(
          (r, i) => ({
            file: `resource-${i}-${r.title.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
            title: r.title,
            description: r.description ?? undefined,
            type: r.type as "video" | "image" | "document",
            sort_order: r.sort_order,
          })
        )
        writeResourcesMeta(cwd, resourcesMeta)
        written++
      }

      // -------------------------------------------------------------------
      // Step 5: Save sync state (compute local hash from what we just wrote)
      // -------------------------------------------------------------------
      const localSnapshot = buildLocalSnapshot(cwd)
      const localHash = computeHashFromSnapshot(localSnapshot)

      writeSyncState(cwd, {
        agent_id: agentId,
        last_remote_hash: pullResult.hash,
        last_local_hash: localHash,
        synced_at: new Date().toISOString(),
      })

      spinner.succeed(
        `Pulled ${chalk.bold(`@${config.username}/${manifest.name}`)} (${written} files written${skipped > 0 ? `, ${skipped} skipped` : ""})`
      )
      console.log(
        chalk.dim(`  Sync hash: ${pullResult.hash.slice(0, 12)}...`)
      )
    } catch (error: any) {
      spinner.fail("Pull failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
