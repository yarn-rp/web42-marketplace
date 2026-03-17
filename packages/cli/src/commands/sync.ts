import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiGet } from "../utils/api.js"
import { requireAuth } from "../utils/config.js"
import {
  buildLocalSnapshot,
  computeHashFromSnapshot,
  readSyncState,
} from "../utils/sync.js"
import type { SyncStatusResponse } from "../types/sync.js"

interface AgentListItem {
  id: string
  slug: string
  name: string
}

export const syncCommand = new Command("sync")
  .description("Check sync status between local workspace and the marketplace")
  .action(async () => {
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

    const spinner = ora("Checking sync status...").start()

    try {
      // Resolve agent ID
      const syncState = readSyncState(cwd)
      let agentId = syncState?.agent_id ?? null

      if (!agentId) {
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

      // Compute local hash
      const distDir = join(cwd, ".web42", "dist")
      let localHash: string | null = null

      if (existsSync(distDir)) {
        const snapshot = buildLocalSnapshot(cwd)
        localHash = computeHashFromSnapshot(snapshot)
      }

      // Fetch remote hash
      const remote = await apiGet<SyncStatusResponse>(
        `/api/agents/${agentId}/sync`
      )
      const remoteHash = remote.hash
      const lastRemoteHash = syncState?.last_remote_hash ?? null
      const lastLocalHash = syncState?.last_local_hash ?? null

      spinner.stop()

      console.log()
      console.log(
        chalk.bold(`  Sync status for @${config.username}/${manifest.name}`)
      )
      console.log()
      console.log(
        `  Remote hash:  ${chalk.cyan(remoteHash.slice(0, 12))}...`
      )
      if (localHash) {
        console.log(
          `  Local hash:   ${chalk.cyan(localHash.slice(0, 12))}...`
        )
      } else {
        console.log(
          `  Local hash:   ${chalk.dim("(not packed yet — run web42 pack first)")}`
        )
      }
      if (lastRemoteHash) {
        console.log(
          `  Last synced:  ${chalk.dim(syncState!.synced_at)}`
        )
      } else {
        console.log(
          `  Last synced:  ${chalk.dim("never")}`
        )
      }
      console.log()

      // Determine sync status by comparing each side against its last-known hash
      if (!lastRemoteHash || !lastLocalHash) {
        console.log(
          chalk.yellow(
            "  Status: Never synced — run `web42 push` or `web42 pull`"
          )
        )
      } else {
        const localChanged = localHash !== null && localHash !== lastLocalHash
        const remoteChanged = remoteHash !== lastRemoteHash

        if (localChanged && remoteChanged) {
          console.log(
            chalk.red(
              "  Status: Both local and remote have changed since last sync"
            )
          )
          console.log(
            chalk.dim(
              "  Use `web42 push --force` or `web42 pull --force` to resolve"
            )
          )
        } else if (localChanged) {
          console.log(chalk.yellow("  Status: Local changes (push to sync)"))
          console.log(chalk.dim("  Run `web42 push` to update the marketplace"))
        } else if (remoteChanged) {
          console.log(
            chalk.yellow("  Status: Remote changes (pull to sync)")
          )
          console.log(chalk.dim("  Run `web42 pull` to update local files"))
        } else {
          console.log(chalk.green("  Status: In sync"))
        }
      }

      console.log()
    } catch (error: any) {
      spinner.fail("Sync status check failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
