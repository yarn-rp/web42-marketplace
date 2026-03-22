# Meal Planner — A2A Server Example

An A2A server built with [`@a2a-js/sdk`](https://github.com/a2aproject/a2a-js) and IoA Auth.
Generates personalised meal plans and shopping lists via Claude Opus.
Callers are identified from their IoA Bearer token — Claude greets them by name.

## Stack

| | |
|---|---|
| A2A protocol | `@a2a-js/sdk` v0.3.0 |
| Auth | IoA `/introspect` via `@ioa/auth` |
| LLM | Gemini 2.0 Flash (streaming + JSON mode) |
| Transport | JSON-RPC over HTTP + SSE |

## Endpoints

| Path | Auth | Description |
|---|---|---|
| `GET /.well-known/agent.json` | None | Agent Card (public) |
| `POST /a2a/jsonrpc` | IoA Bearer | A2A JSON-RPC handler |

## Skills

| Skill | Trigger | Output |
|---|---|---|
| `meal-plan` | Default | Streaming `text` artifact (Claude streams via SSE) |
| `shopping-list` | Message contains "shopping list" | `data` artifact — structured JSON |

---

## Setup

**1.** Register a Developer App in the IoA dashboard (`http://localhost:8082/dashboard`).
Save the `client_id` and `client_secret`.

**2.** Get a Personal Access Token from the dashboard.

**3.** Configure and run:

```bash
cp .env.example .env
# fill in IOA_CLIENT_ID, IOA_CLIENT_SECRET, ANTHROPIC_API_KEY

npm install
npm run dev
```

---

## Usage

```bash
TOKEN=eyJ...your-ioa-token...

# Inspect the Agent Card (no auth needed)
curl http://localhost:3001/.well-known/agent.json | jq

# Send a task (blocking)
curl http://localhost:3001/a2a/jsonrpc \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0", "id": "1", "method": "message/send",
    "params": {
      "message": {
        "messageId": "msg-1",
        "role": "user",
        "kind": "message",
        "parts": [{ "kind": "text", "text": "Create a 5-day vegan meal plan for 2 people" }]
      }
    }
  }'

# Subscribe to streaming updates (SSE)
curl -N http://localhost:3001/a2a/jsonrpc \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0", "id": "2", "method": "message/stream",
    "params": {
      "message": {
        "messageId": "msg-2",
        "role": "user",
        "kind": "message",
        "parts": [{ "kind": "text", "text": "7-day high-protein gluten-free plan" }]
      }
    }
  }'

# Shopping list from a meal plan
curl http://localhost:3001/a2a/jsonrpc \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0", "id": "3", "method": "message/send",
    "params": {
      "message": {
        "messageId": "msg-3",
        "role": "user",
        "kind": "message",
        "parts": [{ "kind": "text", "text": "Generate a shopping list from this: Day 1: oatmeal, chicken salad, apple, pasta..." }]
      }
    }
  }'
```

### Using the A2A client SDK

```typescript
import { ClientFactory } from "@a2a-js/sdk/client";
import { createAuthenticatingFetchWithRetry, JsonRpcTransportFactory, ClientFactoryOptions } from "@a2a-js/sdk/client";

// Inject the IoA Bearer token on every request
const authFetch = createAuthenticatingFetchWithRetry(fetch, {
  headers: async () => ({ Authorization: `Bearer ${process.env.IOA_TOKEN}` }),
  shouldRetryWithHeaders: async () => undefined,
});

const factory = new ClientFactory(
  ClientFactoryOptions.createFrom(ClientFactoryOptions.default, {
    transports: [new JsonRpcTransportFactory({ fetchImpl: authFetch })],
  }),
);

const client = await factory.createFromUrl("http://localhost:3001");

// Blocking send
const result = await client.sendMessage({
  message: {
    messageId: crypto.randomUUID(),
    role: "user",
    kind: "message",
    parts: [{ kind: "text", text: "Create a 7-day Mediterranean meal plan" }],
  },
});

if (result.kind === "task") {
  console.log(`Task ${result.id}: ${result.status.state}`);
  const artifact = result.artifacts?.[0];
  if (artifact) console.log(artifact.parts[0].text);
}

// Streaming
const stream = client.sendMessageStream({
  message: {
    messageId: crypto.randomUUID(),
    role: "user",
    kind: "message",
    parts: [{ kind: "text", text: "5-day vegan plan" }],
  },
});

for await (const event of stream) {
  if (event.kind === "status-update") console.log("Status:", event.status.state);
  if (event.kind === "artifact-update") process.stdout.write(event.artifact.parts[0].text ?? "");
}
```

---

## How auth flows

```
Client / Caller Agent
      │
      │  POST /a2a/jsonrpc
      │  Authorization: Bearer <ioa-token>
      ▼
Express auth middleware
      │
      ├── checkToken(ioa, header) ──▶ IoA Auth :8082 /introspect
      │                                  ← { active, sub, email }
      │
      │  tokenStorage.run(tokenInfo, next)   ← AsyncLocalStorage
      ▼
@a2a-js/sdk jsonRpcHandler
      ▼
MealPlannerExecutor.execute()
      │
      ├── tokenStorage.getStore()  ← reads TokenInfo from async context
      │   firstName(tokenInfo.email) = "Javier"
      │
      ├── Claude Opus 4.6 (streaming)
      │   system: "...greet Javier by name..."
      │
      └── eventBus.publish(artifact-update) ──▶ SSE stream ──▶ Client
```

`AsyncLocalStorage` is the key: it threads the IoA `TokenInfo` from the Express middleware into the A2A executor through the full async call chain, without any modification to the SDK layer.
