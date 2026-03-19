import { Command } from "commander"

import type { PlatformAdapter } from "./base.js"
import { openclawAdapter } from "./openclaw/adapter.js"
import { claudeAdapter } from "./claude/adapter.js"
import { makeInstallCommand } from "../commands/install.js"
import { makeUninstallCommand } from "../commands/uninstall.js"
import { makeUpdateCommand } from "../commands/update.js"
import { makeListCommand } from "../commands/list.js"

const platforms = new Map<string, PlatformAdapter>()
platforms.set("openclaw", openclawAdapter)
platforms.set("claude", claudeAdapter)

export function resolvePlatform(name: string): PlatformAdapter {
  const adapter = platforms.get(name)
  if (!adapter) {
    const available = [...platforms.keys()].join(", ")
    throw new Error(
      `Unknown platform "${name}". Available platforms: ${available}`
    )
  }
  return adapter
}

export function listPlatforms(): string[] {
  return [...platforms.keys()]
}

export function createPlatformCommand(adapter: PlatformAdapter): Command {
  const cmd = new Command(adapter.name).description(
    `Manage ${adapter.name} agents`
  )

  cmd.addCommand(makeInstallCommand(adapter))
  cmd.addCommand(makeUninstallCommand(adapter))
  cmd.addCommand(makeUpdateCommand(adapter))
  cmd.addCommand(makeListCommand(adapter))

  return cmd
}

export function getAllPlatformCommands(): Command[] {
  return [...platforms.values()].map(createPlatformCommand)
}
