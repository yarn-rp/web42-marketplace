"""Web42 Auth SDK — public surface."""
from .client import AsyncWeb42Client, Web42AuthError, Web42Client, TokenInfo
from .a2a import (
    AgentCardOptions,
    build_agent_card,
    build_agent_card_security,
    create_a2a_app,
    WEB42_SECURITY_SCHEME,
)

__all__ = [
    "Web42Client",
    "AsyncWeb42Client",
    "TokenInfo",
    "Web42AuthError",
    # A2A helpers
    "AgentCardOptions",
    "build_agent_card",
    "build_agent_card_security",
    "create_a2a_app",
    "WEB42_SECURITY_SCHEME",
]
