import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"
import express from "express"
import {
  agentCardHandler,
  jsonRpcHandler,
} from "@a2a-js/sdk/server/express"
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  type AgentExecutor,
  type RequestContext,
  type ExecutionEventBus,
} from "@a2a-js/sdk/server"
import type { AgentCard } from "@a2a-js/sdk"
import type { User } from "@a2a-js/sdk/server"
import { requireAuth, getConfig } from "../utils/config.js"

// ---------------------------------------------------------------------------
// StdinExecutor — generic executor that pipes user messages to a subprocess
// ---------------------------------------------------------------------------

class EchoExecutor implements AgentExecutor {
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const { taskId, contextId, userMessage } = requestContext
    const userText =
      (userMessage.parts as Array<{ kind: string; text?: string }>)
        .find((p) => p.kind === "text")?.text ?? ""

    eventBus.publish({
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "response",
        parts: [{ kind: "text", text: `Echo: ${userText}` }],
      },
    })

    eventBus.publish({
      kind: "status-update",
      taskId,
      contextId,
      status: { state: "completed", timestamp: new Date().toISOString() },
      final: true,
    })
    eventBus.finished()
  }

  cancelTask = async (): Promise<void> => {}
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const serveCommand = new Command("serve")
  .description("Start a local A2A server for your agent")
  .option("--port <port>", "Port to listen on", "4000")
  .option("--url <url>", "Public URL (e.g. from ngrok) shown in logs and AgentCard")
  .option("--client-id <id>", "Developer app client ID (or set WEB42_CLIENT_ID)")
  .option("--client-secret <secret>", "Developer app client secret (or set WEB42_CLIENT_SECRET)")
  .option("--verbose", "Enable verbose request/response logging")
  .action(
    async (opts: {
      port: string
      url?: string
      clientId?: string
      clientSecret?: string
      verbose?: boolean
    }) => {
      const verbose = opts.verbose ?? false

      let token: string
      try {
        const authConfig = requireAuth()
        token = authConfig.token!
      } catch {
        console.error(chalk.red("Not authenticated. Run `web42 auth login` first."))
        process.exit(1)
      }

      const clientId = opts.clientId ?? process.env.WEB42_CLIENT_ID
      const clientSecret = opts.clientSecret ?? process.env.WEB42_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error(
          chalk.red(
            "Developer app credentials required.\n" +
            "  Provide --client-id and --client-secret flags,\n" +
            "  or set WEB42_CLIENT_ID and WEB42_CLIENT_SECRET env vars.\n" +
            "  Create them at: https://web42.ai/settings/developer-apps"
          )
        )
        process.exit(1)
      }

      const port = parseInt(opts.port, 10)
      const publicUrl = opts.url
      const config = getConfig()
      const web42ApiUrl = config.apiUrl ?? "https://web42.ai"

      const agentName = "Local Agent"
      const agentDescription = ""
      const agentVersion = "1.0.0"
      const skills: Array<{ id: string; name: string; description: string; tags: string[] }> = []

      const spinner = ora("Starting A2A server...").start()

      const agentCard: AgentCard = {
        name: agentName,
        description: agentDescription,
        protocolVersion: "0.3.0",
        version: agentVersion,
        url: `${publicUrl ?? `http://localhost:${port}`}/a2a/jsonrpc`,
        skills,
        capabilities: {
          streaming: true,
          pushNotifications: false,
        },
        defaultInputModes: ["text"],
        defaultOutputModes: ["text"],
        securitySchemes: {
          Web42Bearer: { type: "http", scheme: "bearer" },
        },
        security: [{ Web42Bearer: [] }],
      }

      const app = express()

      // Auth: validate caller's Bearer token via Web42 introspection with Basic auth
      const basicAuth = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`

      const userBuilder = async (req: express.Request): Promise<User> => {
        const callerToken = req.headers.authorization?.split(" ")[1]
        if (!callerToken) throw new Error("Missing token")

        if (verbose) {
          console.log(chalk.gray(`[verbose] Introspecting token ${callerToken.slice(0, 8)}...`))
        }

        const res = await fetch(`${web42ApiUrl}/api/auth/introspect`, {
          method: "POST",
          headers: {
            Authorization: basicAuth,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ token: callerToken }),
        })

        if (!res.ok) throw new Error("Introspect call failed")
        const result = (await res.json()) as { active: boolean; sub?: string; email?: string }

        if (verbose) {
          console.log(chalk.gray(`[verbose] active=${result.active} sub=${result.sub ?? "(none)"}`))
        }

        if (!result.active) throw new Error("Unauthorized")

        return {
          get isAuthenticated() { return true },
          get userName() { return result.sub ?? "" },
        }
      }

      const executor = new EchoExecutor()
      const requestHandler = new DefaultRequestHandler(agentCard, new InMemoryTaskStore(), executor)

      app.use(
        "/.well-known/agent-card.json",
        agentCardHandler({ agentCardProvider: requestHandler })
      )
      app.use("/a2a/jsonrpc", jsonRpcHandler({ requestHandler, userBuilder }))

      const a2aUrl = `${publicUrl ?? `http://localhost:${port}`}/a2a/jsonrpc`

      // Auto-register agent with directory
      const registrationUrl = opts.url ?? `http://localhost:${port}`
      try {
        await fetch(`${web42ApiUrl}/api/agents`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: registrationUrl }),
        })
        console.log(chalk.dim("  Pre-registered with marketplace"))
      } catch {
        console.warn(chalk.yellow("  Could not pre-register with marketplace"))
      }

      app.listen(port, async () => {
        spinner.stop()
        console.log(chalk.green(`\n Agent "${agentName}" is live`))
        console.log(chalk.dim(`  Local:      http://localhost:${port}`))
        if (publicUrl) console.log(chalk.dim(`  Public:     ${publicUrl}`))
        console.log(chalk.dim(`  Agent card: http://localhost:${port}/.well-known/agent-card.json`))
        console.log(chalk.dim(`  JSON-RPC:   http://localhost:${port}/a2a/jsonrpc`))

        // Register live URL with marketplace
        try {
          await fetch(`${web42ApiUrl}/api/agents/${agentName}/a2a`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              a2a_url: a2aUrl,
              a2a_enabled: true,
              gateway_status: "live",
            }),
          })
          console.log(chalk.dim("  Registered with marketplace"))
        } catch {
          console.warn(chalk.yellow("  Could not register with marketplace"))
        }

        console.log(chalk.dim("\nWaiting for requests... (Ctrl+C to stop)\n"))
      })

      process.on("SIGINT", async () => {
        console.log(chalk.dim("\nShutting down..."))
        await fetch(`${web42ApiUrl}/api/agents/${agentName}/a2a`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ a2a_url: null, a2a_enabled: false, gateway_status: "offline" }),
        }).catch(() => {})
        process.exit(0)
      })
    }
  )
