"""
A2A server utilities for Web42-authenticated agents.

Requires the ``a2a-sdk`` package (``pip install a2a-sdk``) and an ASGI
framework (``fastapi`` + ``uvicorn`` recommended).

Example::

    import uvicorn
    from web42_auth import AsyncWeb42Client
    from web42_auth.a2a import create_a2a_app, AgentCardOptions

    w42 = AsyncWeb42Client(base_url=..., client_id=..., client_secret=...)

    app = create_a2a_app(
        web42=w42,
        card=AgentCardOptions(
            name="My Agent",
            description="Does cool things",
            base_url="http://localhost:8000",
            skills=[{"id": "cool", "name": "Cool Skill", "description": "..."}],
        ),
        executor=MyCoolExecutor(),
    )

    uvicorn.run(app, host="0.0.0.0", port=8000)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------------------
# Agent card helpers (no a2a-sdk required)
# ---------------------------------------------------------------------------

WEB42_SECURITY_SCHEME = "Web42Bearer"


def build_agent_card_security() -> dict[str, Any]:
    """Return the ``securitySchemes`` + ``security`` blocks for Web42 Bearer auth."""
    return {
        "securitySchemes": {
            WEB42_SECURITY_SCHEME: {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "Web42 JWT (RS256)",
            }
        },
        "security": [{WEB42_SECURITY_SCHEME: []}],
    }


@dataclass
class AgentCardOptions:
    name: str
    description: str
    #: Public base URL of the server, e.g. ``"http://localhost:8000"``.
    #: The JSON-RPC path ``/a2a`` is appended automatically.
    base_url: str
    version: str = "1.0.0"
    skills: list[dict[str, Any]] = field(default_factory=list)
    capabilities: dict[str, Any] = field(
        default_factory=lambda: {"streaming": False, "pushNotifications": False}
    )
    default_input_modes: list[str] = field(default_factory=lambda: ["text"])
    default_output_modes: list[str] = field(default_factory=lambda: ["text"])


def build_agent_card(options: AgentCardOptions) -> dict[str, Any]:
    """
    Build an A2A ``AgentCard`` dict pre-populated with Web42 Bearer security.

    Compatible with ``a2a.types.AgentCard`` from the ``a2a-sdk`` package.
    """
    base = options.base_url.rstrip("/")
    return {
        "name": options.name,
        "description": options.description,
        "url": f"{base}/a2a",
        "protocolVersion": "0.3.0",
        "version": options.version,
        "capabilities": options.capabilities,
        "defaultInputModes": options.default_input_modes,
        "defaultOutputModes": options.default_output_modes,
        "skills": options.skills,
        **build_agent_card_security(),
    }


# ---------------------------------------------------------------------------
# Server factory (requires a2a-sdk + fastapi)
# ---------------------------------------------------------------------------

def create_a2a_app(
    *,
    web42: Any,
    card: AgentCardOptions,
    executor: Any,
    task_store: Any = None,
) -> Any:
    """
    Create a fully-wired Web42-authenticated A2A ASGI application.

    Parameters
    ----------
    web42:
        An :class:`~web42_auth.AsyncWeb42Client` instance used to validate tokens.
    card:
        Agent card configuration. ``base_url`` is used to compute the A2A URL.
    executor:
        An ``a2a.server.agent_execution.AgentExecutor`` implementation.
    task_store:
        Optional custom task store.  Defaults to ``InMemoryTaskStore``.

    Returns
    -------
    A Starlette/FastAPI ``ASGIApp`` you can pass directly to ``uvicorn.run()``,
    or mount under an existing FastAPI app with ``app.mount("/", a2a_app)``.

    Raises
    ------
    ImportError
        If ``a2a-sdk`` or ``fastapi`` is not installed.
    """
    try:
        from a2a.server.apps import A2AStarletteApplication
        from a2a.server.request_handlers import DefaultRequestHandler
        from a2a.server.tasks import InMemoryTaskStore
        from a2a.types import AgentCard
        from starlette.middleware.base import BaseHTTPMiddleware
        from starlette.requests import Request
        from starlette.responses import JSONResponse
    except ImportError as exc:
        raise ImportError(
            "create_a2a_app requires 'a2a-sdk' and 'fastapi'. "
            "Install them with: pip install a2a-sdk fastapi"
        ) from exc

    store = task_store or InMemoryTaskStore()
    card_dict = build_agent_card(card)
    agent_card = AgentCard(**card_dict)

    request_handler = DefaultRequestHandler(
        agent_executor=executor,
        task_store=store,
    )

    a2a_app = A2AStarletteApplication(
        agent_card=agent_card,
        http_handler=request_handler,
    )

    starlette_app = a2a_app.build()

    class Web42AuthMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next: Any) -> Any:
            if request.url.path == "/.well-known/agent.json":
                return await call_next(request)

            auth = request.headers.get("authorization")
            if not auth or not auth.startswith("Bearer "):
                return JSONResponse(
                    {"error": "Missing Bearer token"},
                    status_code=401,
                    headers={"WWW-Authenticate": 'Bearer realm="Web42"'},
                )

            token = auth[len("Bearer "):]
            try:
                token_info = await web42.introspect(token)
            except Exception:
                return JSONResponse(
                    {"error": "Auth service unavailable"},
                    status_code=503,
                    headers={"WWW-Authenticate": 'Bearer realm="Web42", error="temporarily_unavailable"'},
                )

            if not token_info.active:
                return JSONResponse(
                    {"error": "Token inactive or revoked"},
                    status_code=401,
                    headers={"WWW-Authenticate": 'Bearer realm="Web42", error="invalid_token"'},
                )

            request.state.token_info = token_info
            return await call_next(request)

    starlette_app.add_middleware(Web42AuthMiddleware)
    return starlette_app
