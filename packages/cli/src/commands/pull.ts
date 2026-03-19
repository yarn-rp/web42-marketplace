import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs"
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

/**
 * Pull a single agent from the marketplace into a local directory.
 */
async function pullSingleAgent(opts: {
  manifest: Record<string, unknown>
  manifestPath: string
  syncDir: string
  writeDir: string
  distDir: string
  config: { username?: string }
  force?: boolean
  spinner: ReturnType<typeof ora>
}): Promise<void> {
  const { manifest, manifestPath, syncDir, writeDir, distDir, config, spinner } = opts
  const name = (manifest.name as string) ?? ""

  // Step 1: Resolve agent ID
  let syncState = readSyncState(syncDir)
  let agentId = syncState?.agent_id ?? null

  if (!agentId) {
    spinner.text = `Looking up ${name}...`
    const agents = await apiGet<AgentListItem[]>(
      `/api/agents?username=${config.username}`
    )
    const agent = agents.find((a) => a.slug === name)
    if (!agent) {
      spinner.fail(
        `Agent @${config.username}/${name} not found on the marketplace. Run \`web42 push\` first.`
      )
      process.exit(1)
    }
    agentId = agent.id
  }

  // Step 2: Compare remote hash with last known remote hash (unless --force)
  if (!opts.force && syncState?.last_remote_hash) {
    spinner.text = `Checking remote state for ${name}...`
    const remote = await apiGet<SyncStatusResponse>(
      `/api/agents/${agentId}/sync`
    )

    if (remote.hash === syncState.last_remote_hash) {
      console.log(
        chalk.dim(`  ${chalk.bold(`@${config.username}/${name}`)} is already in sync.`)
      )
      return
    }
  }

  // Step 3: Pull full snapshot
  spinner.text = `Downloading ${name}...`
  const pullResult = await apiGet<SyncPullResponse>(
    `/api/agents/${agentId}/sync/pull`
  )
  const { snapshot } = pullResult

  let written = 0

  // Step 4a: Write manifest.json
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

  // Step 4b: Write README.md
  if (snapshot.readme) {
    writeFileSync(join(writeDir, "README.md"), snapshot.readme, "utf-8")
    written++
  }

  // Step 4c: Write marketplace.json
  writeMarketplace(writeDir, snapshot.marketplace)
  written++

  // Step 4d: Write agent files into dist/
  let skipped = 0
  mkdirSync(distDir, { recursive: true })
  for (const file of snapshot.files) {
    if (file.content === null || file.content === undefined) {
      skipped++
      continue
    }
    if (file.path === ".openclaw/config.json") {
      skipped++
      continue
    }
    const filePath = join(distDir, file.path)
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, file.content, "utf-8")
    written++
  }

  // Step 4e: Write resources metadata
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
    writeResourcesMeta(writeDir, resourcesMeta)
    written++
  }

  // Step 5: Save sync state
  const localSnapshot = buildLocalSnapshot(syncDir, distDir)
  const localHash = computeHashFromSnapshot(localSnapshot)

  writeSyncState(syncDir, {
    agent_id: agentId,
    last_remote_hash: pullResult.hash,
    last_local_hash: localHash,
    synced_at: new Date().toISOString(),
  })

  console.log(
    chalk.green(`  Pulled @${config.username}/${name} (${written} files${skipped > 0 ? `, ${skipped} skipped` : ""})`)
  )
  console.log(chalk.dim(`  Sync hash: ${pullResult.hash.slice(0, 12)}...`))
}

export const pullCommand = new Command("pull")
  .description(
    "Pull latest agent state from the Web42 marketplace into the current directory"
  )
  .option("--force", "Skip hash comparison and always pull")
  .option("--agent <name>", "Pull a specific agent (for multi-agent workspaces)")
  .action(async (opts: { force?: boolean; agent?: string }) => {
    const config = requireAuth()
    const cwd = process.cwd()

    // Detect multi-agent workspace (.web42/{name}/manifest.json)
    const web42Dir = join(cwd, ".web42")
    const agentManifests = new Map<string, Record<string, unknown>>()

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

    // Single-agent mode
    if (!isMultiAgent) {
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
        await pullSingleAgent({
          manifest,
          manifestPath,
          syncDir: cwd,
          writeDir: cwd,
          distDir: join(cwd, ".web42", "dist"),
          config,
          force: opts.force,
          spinner,
        })
        spinner.succeed(`Pull complete`)
      } catch (error: any) {
        spinner.fail("Pull failed")
        console.error(chalk.red(error.message))
        process.exit(1)
      }
      return
    }

    // Multi-agent mode
    let agentsToPull: Array<[string, Record<string, unknown>]>
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
      agentsToPull = [[opts.agent, manifest]]
    } else {
      agentsToPull = [...agentManifests.entries()]
    }

    const spinner = ora(`Pulling ${agentsToPull.length} agent(s)...`).start()

    try {
      for (const [agentName, manifest] of agentsToPull) {
        spinner.text = `Pulling ${agentName}...`
        const agentWeb42Dir = join(web42Dir, agentName)

        await pullSingleAgent({
          manifest,
          manifestPath: join(agentWeb42Dir, "manifest.json"),
          syncDir: agentWeb42Dir,
          writeDir: agentWeb42Dir,
          distDir: join(agentWeb42Dir, "dist"),
          config,
          force: opts.force,
          spinner,
        })
      }

      spinner.succeed(`Pulled ${agentsToPull.length} agent(s)`)
    } catch (error: any) {
      spinner.fail("Pull failed")
      console.error(chalk.red(error.message))
      process.exit(1)
    }
  })
