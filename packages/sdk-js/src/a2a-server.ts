/**
 * High-level factory for spinning up a Web42-authenticated A2A server.
 *
 * Requires `@a2a-js/sdk` and `express` to be installed.
 *
 * @example
 * import { Web42Client } from "@web42/auth";
 * import { createA2AServer } from "@web42/auth/a2a";
 *
 * const { tokenStorage, listen } = createA2AServer({
 *   web42: new Web42Client({ baseUrl, clientId, clientSecret }),
 *   card: {
 *     name: "My Agent",
 *     description: "Does cool things",
 *     skills: [{ id: "cool", name: "Cool Skill", description: "...", tags: [] }],
 *   },
 *   executor: new MyCoolExecutor(),
 *   port: 3001,
 * });
 *
 * listen(() => console.log("Agent ready"));
 */

import { AsyncLocalStorage } from "async_hooks";
import express from "express";
import { AGENT_CARD_PATH } from "@a2a-js/sdk";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentExecutorLike = { execute(...args: any[]): Promise<void>; cancelTask?(...args: any[]): Promise<void> };
import { DefaultRequestHandler, InMemoryTaskStore } from "@a2a-js/sdk/server";
import {
  agentCardHandler,
  jsonRpcHandler,
  UserBuilder,
} from "@a2a-js/sdk/server/express";

import type { Web42Client, TokenInfo } from "./client.js";
import { checkToken } from "./middleware.js";
import { buildAgentCard, type BuildAgentCardOptions } from "./agent-card.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface A2AServerOptions {
  /** Web42 client used to validate Bearer tokens on every request. */
  web42: Web42Client;
  /**
   * Agent card fields — `url` is computed automatically from `baseUrl` + port.
   * Everything else mirrors `BuildAgentCardOptions`.
   */
  card: Omit<BuildAgentCardOptions, "url">;
  /** A2A executor that handles tasks. */
  executor: AgentExecutorLike;
  /** TCP port to listen on. Default: `3001`. */
  port?: number;
  /**
   * Base URL visible to callers (used in the agent card `url` field).
   * Default: `http://localhost:<port>`.
   */
  baseUrl?: string;
}

export interface A2AServer {
  /** Underlying Express app — add extra routes if needed. */
  app: ReturnType<typeof express>;
  /**
   * AsyncLocalStorage carrying `TokenInfo` through the A2A executor context.
   * Call `tokenStorage.getStore()` inside `AgentExecutor.execute()` to read
   * the caller's identity without touching the A2A SDK layer.
   */
  tokenStorage: AsyncLocalStorage<TokenInfo>;
  /**
   * Start listening on the configured port + `0.0.0.0`.
   * Mirrors `app.listen()` — pass a callback for a startup log.
   */
  listen(callback?: () => void): ReturnType<ReturnType<typeof express>["listen"]>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a fully-wired Web42-authenticated A2A Express server.
 *
 * Routes configured:
 * - `GET  /.well-known/agent.json`  — public agent card
   * - `POST /a2a/jsonrpc`             — A2A JSON-RPC (Web42 Bearer required)
 *
   * The Web42 `TokenInfo` is propagated into the executor via `AsyncLocalStorage`
 * so you can call `tokenStorage.getStore()` anywhere in the async call chain.
 */
export function createA2AServer(options: A2AServerOptions): A2AServer {
  const port = options.port ?? 3001;
  const baseUrl = (options.baseUrl ?? `http://localhost:${port}`).replace(
    /\/$/,
    "",
  );

  const tokenStorage = new AsyncLocalStorage<TokenInfo>();

  const agentCard = buildAgentCard({
    ...options.card,
    url: `${baseUrl}/a2a/jsonrpc`,
  });

  const requestHandler = new DefaultRequestHandler(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agentCard as any,
    new InMemoryTaskStore(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options.executor as any,
  );

  const app = express();
  app.use(express.json());

  // Public — agent card
  app.use(
    `/${AGENT_CARD_PATH}`,
    agentCardHandler({ agentCardProvider: requestHandler }),
  );

  // Web42 auth gate — validates Bearer token, threads TokenInfo via ALS
  app.use("/a2a", async (req, res, next) => {
    const result = await checkToken(options.web42, req.headers.authorization);
    if (!result.ok) {
      res
        .status(result.status)
        .set(
          "WWW-Authenticate",
          result.status === 401
            ? 'Bearer realm="Web42", error="invalid_token"'
            : 'Bearer realm="Web42", error="temporarily_unavailable"',
        )
        .json({ error: result.error });
      return;
    }
    tokenStorage.run(result.tokenInfo, next);
  });

  // A2A JSON-RPC — auth already enforced above
  app.use(
    "/a2a/jsonrpc",
    jsonRpcHandler({
      requestHandler,
      userBuilder: UserBuilder.noAuthentication,
    }),
  );

  return {
    app,
    tokenStorage,
    listen(callback) {
      return app.listen(port, "0.0.0.0", callback);
    },
  };
}
