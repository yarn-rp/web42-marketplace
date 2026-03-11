#!/usr/bin/env node

import { Command } from "commander"

import { authCommand } from "./commands/auth.js"
import { configCommand } from "./commands/config.js"
import { initCommand } from "./commands/init.js"
import { installCommand } from "./commands/install.js"
import { listCommand } from "./commands/list.js"
import { pullCommand } from "./commands/pull.js"
import { pushCommand } from "./commands/push.js"
import { remixCommand } from "./commands/remix.js"
import { updateCommand } from "./commands/update.js"
import { setApiUrl } from "./utils/config.js"

const program = new Command()

program
  .name("web42")
  .description("Web42 Agent Marketplace CLI - push, pull, install, and remix agent packages")
  .version("0.1.0")
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
program.addCommand(pushCommand)
program.addCommand(pullCommand)
program.addCommand(installCommand)
program.addCommand(remixCommand)
program.addCommand(listCommand)
program.addCommand(updateCommand)

program.parse()
