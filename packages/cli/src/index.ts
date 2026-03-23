#!/usr/bin/env node

import { Command } from "commander"

import { authCommand } from "./commands/auth.js"
import { registerCommand } from "./commands/register.js"
import { searchCommand } from "./commands/search.js"
import { sendCommand } from "./commands/send.js"
import { serveCommand } from "./commands/serve.js"
import { setApiUrl } from "./utils/config.js"
import { CLI_VERSION } from "./version.js"

const program = new Command()

program
  .name("web42")
  .description("Web42 CLI — authenticate, discover, and communicate with A2A agents")
  .version(CLI_VERSION)
  .option("--api-url <url>", "Override the API URL for this invocation")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts()
    if (opts.apiUrl) {
      setApiUrl(opts.apiUrl)
    }
  })

program.addCommand(authCommand)
program.addCommand(registerCommand)
program.addCommand(searchCommand)
program.addCommand(sendCommand)
program.addCommand(serveCommand)

program.parse()
