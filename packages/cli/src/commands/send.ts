import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"
import { v4 as uuidv4 } from "uuid"
import type { CallInterceptor } from "@a2a-js/sdk/client"
import { requireAuth, setConfigValue, getConfigValue } from "../utils/config.js"
import { apiPost } from "../utils/api.js"

interface CachedToken {
  token: string
  agentUrl: string
  expiresAt: string
}

interface HandshakeResponse {
  token: string
  agentUrl: string
  expiresAt: string
}

function isUrl(s: string): boolean {
  return s.startsWith("http://") || s.startsWith("https://")
}

function getCachedToken(slug: string): CachedToken | null {
  const raw = getConfigValue(`agentTokens.${slug}`)
  if (!raw) return null
  try {
    const cached =
      typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as CachedToken)
    if (new Date(cached.expiresAt) <= new Date()) return null
    return cached
  } catch {
    return null
  }
}

export const sendCommand = new Command("send")
  .description("Send a message to an A2A agent")
  .argument("<agent>", "Agent slug (e.g. my-agent) or direct URL (http://localhost:3001)")
  .argument("<message>", "Message to send")
  .option("--new", "Start a new conversation (clears saved context)")
  .option("--context <id>", "Use a specific context ID")
  .action(async (agent: string, userMessage: string, opts: { new?: boolean; context?: string }) => {
    const config = requireAuth()

    let agentUrl: string
    let bearerToken: string
    let agentKey: string

    if (isUrl(agent)) {
      // Direct URL mode — local development, no handshake needed
      agentUrl = agent
      bearerToken = config.token!
      agentKey = new URL(agent).host.replace(/[.:]/g, "-")
    } else {
      // Slug mode — handshake with Web42 platform
      agentKey = agent

      const cached = getCachedToken(agent)

      if (cached) {
        agentUrl = cached.agentUrl
        bearerToken = cached.token
      } else {
        const spinner = ora(`Authenticating with ${agent}...`).start()
        try {
          const res = await apiPost<HandshakeResponse>("/api/auth/handshake", {
            agentSlug: agent,
          })
          agentUrl = res.agentUrl
          bearerToken = res.token

          setConfigValue(
            `agentTokens.${agent}`,
            JSON.stringify({
              token: res.token,
              agentUrl: res.agentUrl,
              expiresAt: res.expiresAt,
            })
          )

          spinner.succeed(`Authenticated with ${agent}`)
        } catch (err) {
          spinner.fail(`Failed to authenticate with ${agent}`)
          console.error(chalk.red(String(err)))
          process.exit(1)
        }
      }
    }

    // Resolve contextId
    const contextKey = `context.${agentKey}`
    let contextId: string

    if (opts.context) {
      contextId = opts.context
    } else if (opts.new) {
      contextId = uuidv4()
    } else {
      contextId = getConfigValue(contextKey) ?? uuidv4()
    }

    setConfigValue(contextKey, contextId)

    // Dynamically import @a2a-js/sdk client
    let ClientFactory: typeof import("@a2a-js/sdk/client").ClientFactory
    let JsonRpcTransportFactory: typeof import("@a2a-js/sdk/client").JsonRpcTransportFactory
    let ClientFactoryOptions: typeof import("@a2a-js/sdk/client").ClientFactoryOptions

    try {
      const clientModule = await import("@a2a-js/sdk/client")
      ClientFactory = clientModule.ClientFactory
      JsonRpcTransportFactory = clientModule.JsonRpcTransportFactory
      ClientFactoryOptions = clientModule.ClientFactoryOptions
    } catch {
      console.error(chalk.red("Failed to load @a2a-js/sdk. Run: pnpm add @a2a-js/sdk"))
      process.exit(1)
    }

    const bearerInterceptor: CallInterceptor = {
      before: async (args) => {
        if (!args.options) args.options = {}
        args.options.serviceParameters = {
          ...(args.options.serviceParameters ?? {}),
          Authorization: `Bearer ${bearerToken}`,
        }
      },
      after: async () => {},
    }

    const connectSpinner = ora(`Connecting to ${agentKey}...`).start()
    let client: Awaited<ReturnType<InstanceType<typeof ClientFactory>["createFromUrl"]>>

    try {
      const factory = new ClientFactory(
        ClientFactoryOptions.createFrom(ClientFactoryOptions.default, {
          transports: [new JsonRpcTransportFactory()],
          clientConfig: {
            interceptors: [bearerInterceptor],
          },
        })
      )
      const a2aBaseUrl = new URL(agentUrl).origin
      client = await factory.createFromUrl(a2aBaseUrl)
      connectSpinner.stop()
    } catch {
      connectSpinner.fail(`Could not reach agent at ${agentUrl}`)
      console.error(chalk.dim("Is the agent server running?"))
      process.exit(1)
    }

    try {
      const stream = client.sendMessageStream({
        message: {
          messageId: uuidv4(),
          role: "user",
          parts: [{ kind: "text", text: userMessage }],
          kind: "message",
          contextId,
        },
      })

      for await (const event of stream) {
        if (event.kind === "artifact-update") {
          const artifact = event.artifact as { parts?: Array<{ kind: string; text?: string }> }
          const text = (artifact.parts ?? [])
            .filter((p) => p.kind === "text")
            .map((p) => p.text ?? "")
            .join("")
          if (text) process.stdout.write(text)
        }
        if (event.kind === "status-update") {
          const update = event as { status?: { state?: string } }
          if (update.status?.state === "failed") {
            console.error(chalk.red("\nAgent returned an error."))
            process.exit(1)
          }
        }
      }

      process.stdout.write("\n")
    } catch (err) {
      console.error(chalk.red("\nConnection lost."), chalk.dim(String(err)))
      process.exit(1)
    }
  })
