import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import express from 'express';
import type { Request as ExpressRequest } from 'express';
import {
  agentCardHandler,
  jsonRpcHandler,
} from '@a2a-js/sdk/server/express';
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  type AgentExecutor,
  type RequestContext,
  type ExecutionEventBus,
} from '@a2a-js/sdk/server';
import type { AgentCard } from '@a2a-js/sdk';
import type { User } from '@a2a-js/sdk/server';
import { requireAuth } from '../utils/config.js';
import { getConfig } from '../utils/config.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ManifestSkill {
  name: string;
  description?: string;
}

interface Manifest {
  name: string;
  description?: string;
  version?: string;
  skills?: ManifestSkill[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// OpenClawAgentExecutor — bridges A2A to OpenClaw's OpenAI-compatible endpoint
// ---------------------------------------------------------------------------

interface OpenClawExecutorOptions {
  openClawPort: number;
  openClawToken: string;
  openClawAgent: string;
}

class OpenClawAgentExecutor implements AgentExecutor {
  constructor(private opts: OpenClawExecutorOptions) {}

  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const { taskId, contextId, userMessage } = requestContext;
    const userText =
      (userMessage.parts as Array<{ kind: string; text?: string }>)
        .find((p) => p.kind === 'text')?.text ?? '';

    let response: globalThis.Response;
    try {
      response = await fetch(
        `http://localhost:${this.opts.openClawPort}/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.opts.openClawToken}`,
            'Content-Type': 'application/json',
            'x-openclaw-agent-id': this.opts.openClawAgent,
            'x-openclaw-session-key': contextId,
          },
          body: JSON.stringify({
            model: 'openclaw',
            stream: true,
            messages: [{ role: 'user', content: userText }],
          }),
        }
      );
    } catch (err) {
      throw new Error(
        `OpenClaw is not reachable on port ${this.opts.openClawPort}. ` +
          `Make sure it is running with chatCompletions enabled. (${String(err)})`
      );
    }

    if (!response.ok) {
      throw new Error(`OpenClaw error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const chunk = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const token = chunk.choices?.[0]?.delta?.content;
          if (token) {
            eventBus.publish({
              kind: 'artifact-update',
              taskId,
              contextId,
              artifact: {
                artifactId: 'response',
                parts: [{ kind: 'text', text: token }],
              },
            });
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }

    eventBus.publish({
      kind: 'status-update',
      taskId,
      contextId,
      status: { state: 'completed', timestamp: new Date().toISOString() },
      final: true,
    });
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => {};
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
  apiUrl: string;
  token: string;
  slug: string;
  a2aUrl: string | null;
  enabled: boolean;
  gatewayStatus: string;
}): Promise<void> {
  try {
    const res = await fetch(`${apiUrl}/api/agents/${slug}/a2a`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ a2a_url: a2aUrl, a2a_enabled: enabled, gateway_status: gatewayStatus }),
    });
    if (!res.ok) {
      console.warn(chalk.yellow(`⚠ Could not register URL with marketplace: ${res.status}`));
    } else {
      console.log(chalk.dim('  Registered with marketplace ✓'));
    }
  } catch (err) {
    console.warn(chalk.yellow(`⚠ Could not register URL with marketplace: ${String(err)}`));
  }
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const serveCommand = new Command('serve')
  .description('Start a local A2A server for your agent')
  .option('--port <port>', 'Port to listen on', '4000')
  .option('--url <url>', 'Public URL (e.g. from ngrok) shown in logs and AgentCard')
  .option('--openclaw-port <port>', 'OpenClaw gateway port', '18789')
  .option('--openclaw-token <token>', 'OpenClaw gateway auth token (or set OPENCLAW_GATEWAY_TOKEN)')
  .option('--openclaw-agent <id>', 'OpenClaw agent ID to target', 'main')
  .action(
    async (opts: {
      port: string;
      url?: string;
      openclawPort: string;
      openclawToken?: string;
      openclawAgent: string;
    }) => {
      // 1. Must be logged into web42
      let token: string;
      try {
        const authConfig = requireAuth();
        token = authConfig.token!;
      } catch {
        console.error(chalk.red('Not authenticated. Run `web42 auth login` first.'));
        process.exit(1);
      }

      const cwd = process.cwd();
      const port = parseInt(opts.port, 10);
      const openClawPort = parseInt(opts.openclawPort, 10);
      const openClawToken =
        opts.openclawToken ?? process.env.OPENCLAW_GATEWAY_TOKEN ?? '';
      const openClawAgent = opts.openclawAgent;
      const publicUrl = opts.url;

      // 2. Read manifest.json
      const manifestPath = join(cwd, 'manifest.json');
      if (!existsSync(manifestPath)) {
        console.error(chalk.red('No manifest.json found in current directory.'));
        console.error(chalk.dim('Run `web42 init` to create one.'));
        process.exit(1);
      }

      let manifest: Manifest;
      try {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
      } catch {
        console.error(chalk.red('Failed to parse manifest.json.'));
        process.exit(1);
      }

      if (!manifest.name) {
        console.error(chalk.red('manifest.json must have a "name" field.'));
        process.exit(1);
      }

      const config = getConfig();
      const web42ApiUrl = config.apiUrl ?? 'https://web42.ai';

      const spinner = ora('Starting A2A server...').start();

      // 3. Build AgentCard from manifest
      const agentCard: AgentCard = {
        name: manifest.name,
        description: manifest.description ?? '',
        protocolVersion: '0.3.0',
        version: manifest.version ?? '1.0.0',
        url: `${publicUrl ?? `http://localhost:${port}`}/a2a/jsonrpc`,
        skills: (manifest.skills ?? []).map((s) => ({
          id: s.name.toLowerCase().replace(/\s+/g, '-'),
          name: s.name,
          description: s.description ?? '',
          tags: [],
        })),
        capabilities: {
          streaming: true,
          pushNotifications: false,
        },
        defaultInputModes: ['text'],
        defaultOutputModes: ['text'],
        securitySchemes: {
          Web42Bearer: { type: 'http', scheme: 'bearer' },
        },
        security: [{ Web42Bearer: [] }],
      };

      // 4. Start Express server
      const app = express();

      // Auth: validate caller's web42 Bearer token against marketplace introspect endpoint
      const userBuilder = async (req: ExpressRequest): Promise<User> => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('Missing token');

        const res = await fetch(`${web42ApiUrl}/api/auth/introspect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) throw new Error('Introspect call failed');
        const result = (await res.json()) as { active: boolean; sub?: string; email?: string };
        if (!result.active) throw new Error('Unauthorized');

        const userId = result.sub ?? '';
        return {
          get isAuthenticated() { return true; },
          get userName() { return userId; },
        };
      };

      const executor = new OpenClawAgentExecutor({ openClawPort, openClawToken, openClawAgent });
      const requestHandler = new DefaultRequestHandler(agentCard, new InMemoryTaskStore(), executor);

      // 5. Mount A2A SDK handlers
      app.use(
        '/.well-known/agent-card.json',
        agentCardHandler({ agentCardProvider: requestHandler })
      );
      app.use('/a2a/jsonrpc', jsonRpcHandler({ requestHandler, userBuilder }));

      const a2aUrl = `${publicUrl ?? `http://localhost:${port}`}/a2a/jsonrpc`;

      // 6. Start listening
      app.listen(port, async () => {
        spinner.stop();
        console.log(chalk.green(`\n✓ Agent "${manifest.name}" is live`));
        console.log(chalk.dim(`  Local:  http://localhost:${port}`));
        if (publicUrl) console.log(chalk.dim(`  Public: ${publicUrl}`));
        console.log(chalk.dim(`  Agent card: http://localhost:${port}/.well-known/agent-card.json`));
        console.log(chalk.dim(`  JSON-RPC:   http://localhost:${port}/a2a/jsonrpc`));

        await publishLiveUrl({
          apiUrl: web42ApiUrl,
          token,
          slug: manifest.name,
          a2aUrl,
          enabled: true,
          gatewayStatus: 'live',
        });

        if (!publicUrl) {
          console.log(chalk.yellow('  ⚠ No --url provided. Registered localhost URL is not publicly reachable; buyers cannot connect.'));
        }

        console.log(chalk.dim('\nWaiting for requests... (Ctrl+C to stop)\n'));
      });

      // 7. Keep process alive
      process.on('SIGINT', async () => {
        console.log(chalk.dim('\nShutting down...'));
        await fetch(`${web42ApiUrl}/api/agents/${manifest.name}/a2a`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ a2a_url: null, a2a_enabled: false, gateway_status: 'offline' }),
        }).catch(() => {}); // best-effort
        process.exit(0);
      });
    }
  );
