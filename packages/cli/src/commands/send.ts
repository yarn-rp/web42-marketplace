import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"
import { v4 as uuidv4 } from "uuid"
import { requireAuth, setConfigValue, getConfigValue } from "../utils/config.js"
import { apiGet } from "../utils/api.js"

interface A2AData {
  a2a_url?: string
  a2a_enabled?: boolean
  gateway_status?: string
}

export const sendCommand = new Command("send")
  .description("Send a message to a live web42 agent")
  .argument("<agent>", "Agent handle, e.g. @javier/gilfoyle")
  .argument("<message>", "Message to send")
  .option("--new", "Start a new conversation (clears saved context)")
  .action(async (agentHandle: string, userMessage: string, opts: { new?: boolean }) => {
    const config = requireAuth()

    // 1. Parse @user/slug
    const match = agentHandle.match(/^@?([\w-]+)\/([\w-]+)$/)
    if (!match) {
      console.error(chalk.red("Invalid agent handle. Expected format: @user/agent-slug"))
      process.exit(1)
    }
    const [, username, slug] = match

    // 2. Look up agent A2A URL from marketplace
    const spinner = ora(`Looking up @${username}/${slug}...`).start()
    let a2aData: A2AData

    try {
      a2aData = await apiGet<A2AData>(`/api/agents/${slug}/a2a`)
    } catch {
      spinner.fail(`Agent @${username}/${slug} not found`)
      process.exit(1)
    }

    if (!a2aData.a2a_enabled || !a2aData.a2a_url) {
      spinner.fail(
        `@${username}/${slug} is not live. Publisher must run: web42 serve --url <url>`
      )
      process.exit(1)
    }

    spinner.stop()

    // 3. Resolve contextId — reuse existing session or start fresh
    const contextKey = `context.${username}.${slug}`
    let contextId = getConfigValue(contextKey) ?? uuidv4()

    if (opts.new) {
      contextId = uuidv4()
    }

    setConfigValue(contextKey, contextId)

    // 4. Dynamically import @a2a-js/sdk client (ESM)
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

    // 5. Bearer token interceptor
    const token = config.token!
    const bearerInterceptor = {
      before: async (args: Record<string, unknown>) => {
        const options = (args.options as Record<string, unknown>) ?? {}
        const serviceParameters = (options.serviceParameters as Record<string, string>) ?? {}
        args.options = {
          ...options,
          serviceParameters: {
            ...serviceParameters,
            Authorization: `Bearer ${token}`,
          },
        }
      },
      after: async () => {},
    }

    // 6. Create A2A client
    const connectSpinner = ora(`Connecting to @${username}/${slug}...`).start()
    let client: Awaited<ReturnType<InstanceType<typeof ClientFactory>["createFromUrl"]>>

    try {
      const factory = new ClientFactory(
        ClientFactoryOptions.createFrom(ClientFactoryOptions.default, {
          transports: [new JsonRpcTransportFactory()],
          clientConfig: {
            interceptors: [bearerInterceptor as Parameters<typeof ClientFactoryOptions.createFrom>[1]["clientConfig"]["interceptors"][0]],
          },
        })
      )
      client = await factory.createFromUrl(a2aData.a2a_url)
      connectSpinner.stop()
    } catch {
      connectSpinner.fail(`Could not reach agent at ${a2aData.a2a_url}`)
      console.error(chalk.dim("Is the publisher running web42 serve? Is ngrok still active?"))
      process.exit(1)
    }

    // 7. Stream response to stdout
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
