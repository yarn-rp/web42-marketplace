#!/usr/bin/env node

import { Command } from "commander"

import { authCommand } from "./commands/auth.js"
import { configCommand } from "./commands/config.js"
import { initCommand } from "./commands/init.js"
import { packCommand } from "./commands/pack.js"
import { pushCommand } from "./commands/push.js"
import { pullCommand } from "./commands/pull.js"
import { remixCommand } from "./commands/remix.js"
import { searchCommand } from "./commands/search.js"
import { syncCommand } from "./commands/sync.js"
import { getAllPlatformCommands } from "./platforms/registry.js"
import { setApiUrl } from "./utils/config.js"
import { CLI_VERSION } from "./version.js"

const program = new Command()

program
  .name("web42")
  .description(
    "Web42 Agent Marketplace CLI — manage, install, and publish agent packages"
  )
  .version(CLI_VERSION)
  .option("--api-url <url>", "Override the API URL for this invocation")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts()
    if (opts.apiUrl) {
      setApiUrl(opts.apiUrl)
    }
  })

program.addCommand(authCommand)
program.addCommand(configCommand)
program.addCommand(initCommand)
program.addCommand(packCommand)
program.addCommand(pushCommand)
program.addCommand(pullCommand)
program.addCommand(remixCommand)
program.addCommand(searchCommand)
program.addCommand(syncCommand)

for (const platformCmd of getAllPlatformCommands()) {
  program.addCommand(platformCmd)
}

program.parse()
