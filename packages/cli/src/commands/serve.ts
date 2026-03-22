import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"
import express from "express"
import type { Request as ExpressRequest } from "express"
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
// OpenClawAgentExecutor — bridges A2A to OpenClaw's OpenAI-compatible endpoint
// ---------------------------------------------------------------------------

interface OpenClawExecutorOptions {
  openClawPort: number
  openClawToken: string
  openClawAgent: string
  verbose?: boolean
}

class OpenClawAgentExecutor implements AgentExecutor {
  private verbose: boolean

  constructor(private opts: OpenClawExecutorOptions) {
    this.verbose = opts.verbose ?? false
  }

  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const { taskId, contextId, userMessage } = requestContext
    const userText =
      (userMessage.parts as Array<{ kind: string; text?: string }>)
        .find((p) => p.kind === "text")?.text ?? ""

    if (this.verbose) {
      console.log(chalk.gray(`[verbose] → OpenClaw request: agent=${this.opts.openClawAgent} session=${contextId} port=${this.opts.openClawPort}`))
      console.log(chalk.gray(`[verbose] → message text: "${userText.slice(0, 100)}"`))
    }

    let response: globalThis.Response
    try {
      response = await fetch(
        `http://localhost:${this.opts.openClawPort}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.opts.openClawToken}`,
            "Content-Type": "application/json",
            "x-openclaw-agent-id": this.opts.openClawAgent,
            "x-openclaw-session-key": `agent:${this.opts.openClawAgent}:${contextId}`,
          },
          body: JSON.stringify({
            model: "openclaw",
            stream: true,
            messages: [{ role: "user", content: userText }],
          }),
        }
      )
    } catch (err) {
      throw new Error(
        `OpenClaw is not reachable on port ${this.opts.openClawPort}. ` +
          `Make sure it is running with chatCompletions enabled. (${String(err)})`
      )
    }

    if (this.verbose) {
      console.log(chalk.gray(`[verbose] ← OpenClaw response: status=${response.status}`))
    }

    if (!response.ok) {
      if (this.verbose) {
        const body = await response.text().catch(() => "(unreadable)")
        console.log(chalk.gray(`[verbose] ← response body: ${body}`))
      }
      throw new Error(`OpenClaw error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let tokenCount = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const data = line.slice(6).trim()
        if (data === "[DONE]") continue

        try {
          const chunk = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const token = chunk.choices?.[0]?.delta?.content
          if (token) {
            tokenCount++
            eventBus.publish({
              kind: "artifact-update",
              taskId,
              contextId,
              artifact: {
                artifactId: "response",
                parts: [{ kind: "text", text: token }],
              },
            })
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }

    if (this.verbose) {
      console.log(chalk.gray(`[verbose] ← stream complete: ${tokenCount} tokens received`))
    }

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
// Helpers
// ---------------------------------------------------------------------------

async function publishLiveUrl({
  apiUrl,
  token,
  slug,
  a2aUrl,
  enabled,
  gatewayStatus,
}: {
  apiUrl: string
  token: string
  slug: string
  a2aUrl: string | null
  enabled: boolean
  gatewayStatus: string
}): Promise<void> {
  try {
    const res = await fetch(`${apiUrl}/api/agents/${slug}/a2a`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ a2a_url: a2aUrl, a2a_enabled: enabled, gateway_status: gatewayStatus }),
    })
    if (!res.ok) {
      console.warn(chalk.yellow(`  Could not register URL with marketplace: ${res.status}`))
    } else {
      console.log(chalk.dim("  Registered with marketplace"))
    }
  } catch (err) {
    console.warn(chalk.yellow(`  Could not register URL with marketplace: ${String(err)}`))
  }
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const serveCommand = new Command("serve")
  .description("Start a local A2A server for your agent")
  .option("--port <port>", "Port to listen on", "4000")
  .option("--url <url>", "Public URL (e.g. from ngrok) for registration and AgentCard")
  .option("--openclaw-port <port>", "OpenClaw gateway port", "18789")
  .option("--openclaw-token <token>", "OpenClaw gateway auth token (or set OPENCLAW_GATEWAY_TOKEN)")
  .option("--openclaw-agent <id>", "OpenClaw agent ID to target", "main")
  .option("--client-id <id>", "Developer app client ID (or set WEB42_CLIENT_ID)")
  .option("--client-secret <secret>", "Developer app client secret (or set WEB42_CLIENT_SECRET)")
  .option("--verbose", "Enable verbose request/response logging")
  .action(
    async (opts: {
      port: string
      url?: string
      openclawPort: string
      openclawToken?: string
      openclawAgent: string
      clientId?: string
      clientSecret?: string
      verbose?: boolean
    }) => {
      const verbose = opts.verbose ?? false

      // 1. Must be logged into web42
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

      const openClawPort = parseInt(opts.openclawPort, 10)
      const openClawToken =
        opts.openclawToken ?? process.env.OPENCLAW_GATEWAY_TOKEN ?? ""
      const openClawAgent = opts.openclawAgent

      const cwd = process.cwd()
      const port = parseInt(opts.port, 10)
      const publicUrl = opts.url
      const config = getConfig()
      const web42ApiUrl = config.apiUrl ?? "https://web42.ai"

      // 2. Read agent-card.json from cwd
      const cardPath = join(cwd, "agent-card.json")
      if (!existsSync(cardPath)) {
        console.error(chalk.red("No agent-card.json found in current directory."))
        console.error(chalk.dim("Create an agent-card.json with your agent's A2A card."))
        process.exit(1)
      }

      let cardData: Record<string, unknown>
      try {
        cardData = JSON.parse(readFileSync(cardPath, "utf-8")) as Record<string, unknown>
      } catch {
        console.error(chalk.red("Failed to parse agent-card.json."))
        process.exit(1)
      }

      const agentName = (cardData.name as string) ?? "Untitled Agent"

      if (!agentName || agentName === "Untitled Agent") {
        console.error(chalk.red('agent-card.json must have a "name" field.'))
        process.exit(1)
      }

      const spinner = ora("Starting A2A server...").start()

      // 3. Build AgentCard from local file + overrides
      const agentCard: AgentCard = {
        name: agentName,
        description: (cardData.description as string) ?? "",
        protocolVersion: (cardData.protocolVersion as string) ?? "0.3.0",
        version: (cardData.version as string) ?? "1.0.0",
        url: `${publicUrl ?? `http://localhost:${port}`}/a2a/jsonrpc`,
        skills: (cardData.skills as AgentCard["skills"]) ?? [],
        capabilities: {
          streaming: true,
          pushNotifications: false,
          ...(cardData.capabilities as Record<string, unknown> ?? {}),
        },
        defaultInputModes: (cardData.defaultInputModes as string[]) ?? ["text"],
        defaultOutputModes: (cardData.defaultOutputModes as string[]) ?? ["text"],
        securitySchemes: {
          Web42Bearer: { type: "http", scheme: "bearer" },
        },
        security: [{ Web42Bearer: [] }],
      }

      // 4. Start Express server
      const app = express()

      // Auth: validate caller's Bearer token via Web42 introspection with Basic auth
      const basicAuth = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`

      const userBuilder = async (req: ExpressRequest): Promise<User> => {
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

      const executor = new OpenClawAgentExecutor({
        openClawPort,
        openClawToken,
        openClawAgent,
        verbose,
      })
      const requestHandler = new DefaultRequestHandler(agentCard, new InMemoryTaskStore(), executor)

      // 5. Mount A2A SDK handlers
      app.use(
        "/.well-known/agent-card.json",
        agentCardHandler({ agentCardProvider: requestHandler })
      )
      app.use("/a2a/jsonrpc", jsonRpcHandler({ requestHandler, userBuilder }))

      const a2aUrl = `${publicUrl ?? `http://localhost:${port}`}/a2a/jsonrpc`

      // 6. Start listening, then register
      app.listen(port, async () => {
        spinner.stop()
        console.log(chalk.green(`\n Agent "${agentName}" is live`))
        console.log(chalk.dim(`  Local:      http://localhost:${port}`))
        if (publicUrl) console.log(chalk.dim(`  Public:     ${publicUrl}`))
        console.log(chalk.dim(`  Agent card: http://localhost:${port}/.well-known/agent-card.json`))
        console.log(chalk.dim(`  JSON-RPC:   http://localhost:${port}/a2a/jsonrpc`))

        if (verbose) {
          console.log(chalk.gray(`[verbose] OpenClaw target: http://localhost:${openClawPort}/v1/chat/completions agent=${openClawAgent}`))
        }

        // Register agent with marketplace — API crawls back to fetch the card
        const registrationUrl = publicUrl ?? `http://localhost:${port}`
        let registeredSlug: string | null = null

        try {
          const regRes = await fetch(`${web42ApiUrl}/api/agents`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: registrationUrl }),
          })

          if (regRes.ok) {
            const regData = (await regRes.json()) as {
              agent?: { slug?: string }
            }
            registeredSlug = regData.agent?.slug ?? null
            console.log(chalk.dim(`  Registered with marketplace (slug: ${registeredSlug})`))
          } else {
            const errBody = await regRes.json().catch(() => ({})) as { error?: string }
            console.warn(chalk.yellow(`  Could not register with marketplace: ${errBody.error ?? regRes.status}`))
          }
        } catch (err) {
          console.warn(chalk.yellow(`  Could not register with marketplace: ${String(err)}`))
        }

        // Publish live A2A URL
        if (registeredSlug) {
          await publishLiveUrl({
            apiUrl: web42ApiUrl,
            token,
            slug: registeredSlug,
            a2aUrl,
            enabled: true,
            gatewayStatus: "live",
          })
        }

        if (!publicUrl) {
          console.log(chalk.yellow("  No --url provided. Registered localhost URL is not publicly reachable."))
        }

        console.log(chalk.dim("\nWaiting for requests... (Ctrl+C to stop)\n"))

        // 7. Graceful shutdown
        process.on("SIGINT", async () => {
          console.log(chalk.dim("\nShutting down..."))
          if (registeredSlug) {
            await publishLiveUrl({
              apiUrl: web42ApiUrl,
              token,
              slug: registeredSlug,
              a2aUrl: null,
              enabled: false,
              gatewayStatus: "offline",
            }).catch(() => {})
          }
          process.exit(0)
        })
      })
    }
  )
