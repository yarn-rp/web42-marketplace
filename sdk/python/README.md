# ioa-auth — Python SDK

IoA Auth client for Python services.  Validate user tokens via the `/introspect` endpoint and plug into FastAPI or Flask with one line.

## Installation

```bash
pip install ioa-auth                    # core only (httpx)
pip install "ioa-auth[fastapi]"         # + FastAPI dependency helper
pip install "ioa-auth[flask]"           # + Flask decorator
pip install "ioa-auth[a2a]"             # + A2A server factory (a2a-sdk + starlette)
pip install "ioa-auth[all]"             # everything
```

> Requires Python 3.9+.

---

## Quick start

```python
from ioa_auth import IoAClient

client = IoAClient(
    base_url="https://auth.example.com",
    client_id="your-client-id",
    client_secret="your-client-secret",
)

info = client.introspect(bearer_token)

if info.active:
    print(f"Authenticated: {info.email} ({info.provider})")
else:
    print("Token inactive or revoked")
```

---

## Reference

### `IoAClient(base_url, client_id, client_secret, *, timeout=5.0)`

Synchronous client backed by `httpx`.

| Parameter | Type | Description |
|---|---|---|
| `base_url` | `str` | Auth service URL, e.g. `https://auth.example.com` |
| `client_id` | `str` | Your app's `client_id` |
| `client_secret` | `str` | Your app's `client_secret` |
| `timeout` | `float` | Request timeout in seconds (default `5.0`) |

#### `.introspect(token: str) → TokenInfo`

Calls `POST /introspect`.  Always returns a `TokenInfo` — check `.active` before trusting other fields.

Raises `IoAAuthError(message, status_code)` on HTTP errors from the auth service (e.g. 401 for bad credentials, 503 for unreachable service).

Can be used as a context manager:

```python
with IoAClient(...) as client:
    info = client.introspect(token)
```

---

### `AsyncIoAClient(base_url, client_id, client_secret, *, timeout=5.0)`

Async variant — same interface, all methods are `async`.

```python
async with AsyncIoAClient(...) as client:
    info = await client.introspect(token)
```

---

### `TokenInfo`

```python
@dataclass
class TokenInfo:
    active: bool
    sub: str | None       # user UUID
    email: str | None
    provider: str | None  # "google" | "github"
    exp: int | None       # Unix timestamp
    iat: int | None       # Unix timestamp
```

---

## FastAPI

```python
import os
from fastapi import FastAPI, Depends
from ioa_auth import AsyncIoAClient
from ioa_auth.middleware.fastapi import make_require_token

app = FastAPI()

ioa = AsyncIoAClient(
    base_url=os.environ["IOA_AUTH_URL"],
    client_id=os.environ["IOA_CLIENT_ID"],
    client_secret=os.environ["IOA_CLIENT_SECRET"],
)
require_token = make_require_token(ioa)

@app.get("/protected")
async def protected(token_info=Depends(require_token)):
    return {"user": token_info.sub, "email": token_info.email}
```

The dependency raises `HTTP 401` automatically when the token is missing or inactive, and `HTTP 503` when the auth service is unreachable.

Optional — allow unauthenticated requests (returns `None` instead of raising):

```python
require_token_optional = make_require_token(ioa, auto_error=False)

@app.get("/public-or-private")
async def maybe_auth(token_info=Depends(require_token_optional)):
    if token_info:
        return {"user": token_info.sub}
    return {"user": "anonymous"}
```

---

## Flask

```python
import os
from flask import Flask, g, jsonify
from ioa_auth import IoAClient
from ioa_auth.middleware.flask import require_token

app = Flask(__name__)
ioa = IoAClient(
    base_url=os.environ["IOA_AUTH_URL"],
    client_id=os.environ["IOA_CLIENT_ID"],
    client_secret=os.environ["IOA_CLIENT_SECRET"],
)

@app.get("/protected")
@require_token(ioa)
def protected():
    return jsonify({"user": g.token_info.sub, "email": g.token_info.email})
```

`g.token_info` is populated with the validated `TokenInfo` for the duration of the request.

---

## A2A server

> Requires `pip install "ioa-auth[a2a]"` (`a2a-sdk` + `starlette`).

`create_a2a_app` wires up a fully authenticated [A2A](https://github.com/a2aproject/A2A) ASGI application in one call:
- Public agent card endpoint (`GET /.well-known/agent.json`)
- IoA Bearer token validation on every A2A request
- Caller `TokenInfo` available on `request.state.token_info` inside your executor
- RFC 6750-compliant `WWW-Authenticate` headers on auth failures

```python
import os
import uvicorn
from ioa_auth import AsyncIoAClient, AgentCardOptions, create_a2a_app

# Your a2a-sdk executor
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue

class MyExecutor(AgentExecutor):
    async def execute(self, ctx: RequestContext, queue: EventQueue) -> None:
        # Caller identity is on ctx.request.state.token_info
        token_info = getattr(ctx.request.state, "token_info", None)
        print(f"Request from: {token_info.email if token_info else 'unknown'}")
        # ... enqueue task events

    async def cancel(self, ctx: RequestContext, queue: EventQueue) -> None:
        pass

ioa = AsyncIoAClient(
    base_url=os.environ["IOA_AUTH_URL"],
    client_id=os.environ["IOA_CLIENT_ID"],
    client_secret=os.environ["IOA_CLIENT_SECRET"],
)

app = create_a2a_app(
    ioa=ioa,
    card=AgentCardOptions(
        name="My Agent",
        description="Does something useful",
        base_url="http://localhost:8000",
        skills=[
            {
                "id": "my-skill",
                "name": "My Skill",
                "description": "Does something specific",
                "tags": ["example"],
            }
        ],
        capabilities={"streaming": False, "pushNotifications": False},
    ),
    executor=MyExecutor(),
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### `AgentCardOptions`

| Field | Type | Description |
|---|---|---|
| `name` | `str` | Agent display name |
| `description` | `str` | Agent description |
| `base_url` | `str` | Public base URL; `/a2a` is appended to form the JSON-RPC URL |
| `version` | `str` | Agent version (default `"1.0.0"`) |
| `skills` | `list[dict]` | List of skill definitions |
| `capabilities` | `dict` | A2A capabilities (default `{"streaming": False, "pushNotifications": False}`) |
| `default_input_modes` | `list[str]` | Default `["text"]` |
| `default_output_modes` | `list[str]` | Default `["text"]` |

#### `create_a2a_app(*, ioa, card, executor, task_store=None)`

Returns a Starlette ASGI app.  Pass it to `uvicorn.run()` or mount it under an existing FastAPI app:

```python
from fastapi import FastAPI

main_app = FastAPI()
main_app.mount("/", create_a2a_app(...))
```

---

## Agent card helpers

Use these if you want to build the agent card dict manually.

### `build_agent_card(options: AgentCardOptions) → dict`

Returns a complete A2A agent card dict with IoA Bearer security pre-populated.

```python
from ioa_auth import AgentCardOptions, build_agent_card

card = build_agent_card(AgentCardOptions(
    name="My Agent",
    description="Does something",
    base_url="https://my-agent.example.com",
    skills=[...],
))
```

### `build_agent_card_security() → dict`

Returns only the `securitySchemes` + `security` keys to merge into an existing card dict.

```python
from ioa_auth import build_agent_card_security

card = {
    "name": "My Agent",
    # ... other fields ...
    **build_agent_card_security(),
}
```

---

## Error handling

```python
from ioa_auth import IoAAuthError

try:
    info = client.introspect(token)
except IoAAuthError as e:
    if e.status_code == 401:
        # Bad client credentials — check your client_id / client_secret
        ...
    else:
        # Auth service error
        ...
```

---

## Environment variables (recommended)

```bash
IOA_AUTH_URL=https://auth.example.com
IOA_CLIENT_ID=550e8400-e29b-41d4-a716-446655440000
IOA_CLIENT_SECRET=ioa_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
