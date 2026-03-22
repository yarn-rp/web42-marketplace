# @ioa/auth — JavaScript / TypeScript SDK

IoA Auth client for Node.js, Deno, Bun, and edge runtimes.  Validate user tokens via the `/introspect` endpoint with first-class TypeScript types and zero runtime dependencies.

## Requirements

- Node.js 18+ (uses native `fetch`)
- Or any runtime with the Fetch API (Deno, Bun, Cloudflare Workers, etc.)

## Installation

```bash
npm install @ioa/auth
# or
pnpm add @ioa/auth
# or
yarn add @ioa/auth
```

For A2A server support, also install the peer deps:

```bash
npm install express @a2a-js/sdk
```

---

## Quick start

```typescript
import { IoAClient } from "@ioa/auth";

const ioa = new IoAClient({
  baseUrl: "https://auth.example.com",
  clientId: process.env.IOA_CLIENT_ID!,
  clientSecret: process.env.IOA_CLIENT_SECRET!,
});

const info = await ioa.introspect(bearerToken);

if (info.active) {
  console.log(`Authenticated: ${info.email} (${info.provider})`);
} else {
  console.log("Token inactive or revoked");
}
```

---

## Reference

### `new IoAClient(options)`

| Option | Type | Description |
|---|---|---|
| `baseUrl` | `string` | Auth service URL, e.g. `https://auth.example.com` |
| `clientId` | `string` | Your app's `client_id` |
| `clientSecret` | `string` | Your app's `client_secret` |
| `timeout` | `number` | Request timeout in ms (default `5000`) |

### `.introspect(token: string): Promise<TokenInfo>`

Calls `POST /introspect`.  Always resolves — check `.active` before trusting other fields.

Throws `IoAAuthError` on unexpected HTTP errors (e.g. 401 for bad credentials).

---

### `TokenInfo`

```typescript
interface TokenInfo {
  active: boolean;
  sub?: string;       // user UUID
  email?: string;
  provider?: string;  // "google" | "github"
  exp?: number;       // Unix timestamp
  iat?: number;       // Unix timestamp
}
```

---

## Express middleware

```typescript
import express from "express";
import { IoAClient, createExpressMiddleware } from "@ioa/auth";

const ioa = new IoAClient({
  baseUrl: process.env.IOA_AUTH_URL!,
  clientId: process.env.IOA_CLIENT_ID!,
  clientSecret: process.env.IOA_CLIENT_SECRET!,
});

const app = express();

// Protect all routes below this line
app.use(createExpressMiddleware(ioa));

app.get("/protected", (req, res) => {
  // req.tokenInfo is populated and typed
  res.json({ user: req.tokenInfo!.sub, email: req.tokenInfo!.email });
});
```

TypeScript note: `req.tokenInfo` is declared on `Express.Request` automatically — no manual augmentation needed.

#### Custom token extraction

```typescript
app.use(
  createExpressMiddleware(ioa, {
    // Extract token from a custom header instead of Authorization
    getToken: (req) => req.headers["x-user-token"] as string | undefined,
  }),
);
```

#### Custom error handler

```typescript
app.use(
  createExpressMiddleware(ioa, {
    onError: (err, req, res, next) => {
      // err is IoAAuthError
      console.error("Auth service down:", err.status);
      res.status(503).json({ error: "Service temporarily unavailable" });
    },
  }),
);
```

---

## Next.js App Router

```typescript
// app/api/protected/route.ts
import { NextRequest, NextResponse } from "next/server";
import { IoAClient, checkToken } from "@ioa/auth";

const ioa = new IoAClient({
  baseUrl: process.env.IOA_AUTH_URL!,
  clientId: process.env.IOA_CLIENT_ID!,
  clientSecret: process.env.IOA_CLIENT_SECRET!,
});

export async function GET(req: NextRequest) {
  const result = await checkToken(ioa, req.headers.get("authorization"));

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ user: result.tokenInfo.sub });
}
```

---

## Hono

```typescript
import { Hono } from "hono";
import { IoAClient, checkToken } from "@ioa/auth";

const ioa = new IoAClient({ ... });
const app = new Hono();

app.use("/protected/*", async (c, next) => {
  const result = await checkToken(ioa, c.req.header("authorization"));
  if (!result.ok) return c.json({ error: result.error }, result.status);
  c.set("tokenInfo", result.tokenInfo);
  await next();
});

app.get("/protected/data", (c) => {
  const tokenInfo = c.get("tokenInfo");
  return c.json({ user: tokenInfo.sub });
});
```

---

## A2A server

> Requires `express` and `@a2a-js/sdk` to be installed alongside `@ioa/auth`.

`createA2AServer` wires up a fully authenticated [A2A](https://github.com/a2aproject/A2A) server in one call:
- Public agent card endpoint (`GET /.well-known/agent.json`)
- IoA Bearer token validation on every A2A request
- `AsyncLocalStorage` to thread caller identity into your executor
- RFC 6750-compliant `WWW-Authenticate` headers on auth failures

```typescript
import { IoAClient, createA2AServer } from "@ioa/auth";
import type { AgentExecutor, RequestContext, ExecutionEventBus } from "@a2a-js/sdk/server";

const ioa = new IoAClient({
  baseUrl: process.env.IOA_AUTH_URL!,
  clientId: process.env.IOA_CLIENT_ID!,
  clientSecret: process.env.IOA_CLIENT_SECRET!,
});

class MyExecutor implements AgentExecutor {
  async execute(ctx: RequestContext, bus: ExecutionEventBus) {
    // Access the caller's identity via AsyncLocalStorage
    const tokenInfo = server.tokenStorage.getStore();
    console.log(`Request from: ${tokenInfo?.email}`);
    // ... publish task events to bus
  }
  cancelTask = async () => {};
}

const server = createA2AServer({
  ioa,
  card: {
    name: "My Agent",
    description: "Does something useful",
    capabilities: { streaming: true, pushNotifications: false },
    skills: [
      {
        id: "my-skill",
        name: "My Skill",
        description: "Does something specific",
        tags: ["example"],
        examples: ["Do the thing"],
      },
    ],
  },
  executor: new MyExecutor(),
  port: 3001,
  // baseUrl defaults to http://localhost:<port>
  // Override for production: baseUrl: "https://my-agent.example.com"
});

server.listen(() => {
  console.log("Agent ready on port 3001");
});
```

#### `A2AServerOptions`

| Option | Type | Description |
|---|---|---|
| `ioa` | `IoAClient` | Client used to validate Bearer tokens |
| `card` | `BuildAgentCardOptions` (without `url`) | Agent card fields; `url` is computed from `baseUrl` |
| `executor` | `AgentExecutor` | Your A2A task executor |
| `port` | `number` | Port to listen on (default `3001`) |
| `baseUrl` | `string` | Public base URL for the agent card `url` field (default `http://localhost:<port>`) |

#### Return value

| Field | Type | Description |
|---|---|---|
| `app` | `Express` | Underlying Express app — add extra routes if needed |
| `tokenStorage` | `AsyncLocalStorage<TokenInfo>` | Call `.getStore()` inside your executor to read the caller's `TokenInfo` |
| `listen(cb?)` | `function` | Start listening on `0.0.0.0:<port>` |

---

## Agent card helpers

Use these if you want to build the agent card manually (e.g. for non-Express A2A servers).

### `buildAgentCard(options)`

Returns a complete A2A `AgentCard` object with IoA Bearer security pre-populated.

```typescript
import { buildAgentCard } from "@ioa/auth";

const agentCard = buildAgentCard({
  name: "My Agent",
  description: "Does useful things",
  url: "https://my-agent.example.com/a2a/jsonrpc",
  version: "1.0.0",               // default "1.0.0"
  capabilities: { streaming: true, pushNotifications: false },
  skills: [{ id: "skill-1", name: "Skill One", description: "...", tags: [] }],
  defaultInputModes: ["text"],    // default ["text"]
  defaultOutputModes: ["text"],   // default ["text"]
});
```

### `buildAgentCardSecurity()`

Returns only the `securitySchemes` + `security` blocks to spread into an existing card object.

```typescript
import { buildAgentCardSecurity } from "@ioa/auth";

const card = {
  name: "My Agent",
  // ... other fields ...
  ...buildAgentCardSecurity(),
};
```

---

## Error handling

```typescript
import { IoAAuthError } from "@ioa/auth";

try {
  const info = await ioa.introspect(token);
} catch (err) {
  if (err instanceof IoAAuthError) {
    if (err.status === 401) {
      // Bad client credentials — check your client_id / client_secret
    } else {
      // Auth service error
    }
  }
}
```

---

## Environment variables (recommended)

```bash
IOA_AUTH_URL=https://auth.example.com
IOA_CLIENT_ID=550e8400-e29b-41d4-a716-446655440000
IOA_CLIENT_SECRET=ioa_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Building from source

```bash
cd sdk/js
npm install
npm run build   # outputs to dist/
npm run typecheck
```
