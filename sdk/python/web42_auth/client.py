"""Web42 Auth client — synchronous and async variants."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import httpx


@dataclass
class TokenInfo:
    """Result of a token introspection call (RFC 7662)."""

    active: bool
    sub: Optional[str] = None
    email: Optional[str] = None
    provider: Optional[str] = None  # "google" | "github"
    exp: Optional[int] = None
    iat: Optional[int] = None

    @classmethod
    def _from_dict(cls, data: dict) -> "TokenInfo":
        return cls(
            active=bool(data.get("active")),
            sub=data.get("sub"),
            email=data.get("email"),
            provider=data.get("provider"),
            exp=data.get("exp"),
            iat=data.get("iat"),
        )


class Web42AuthError(Exception):
    """Raised when the auth service returns an unexpected error."""

    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code


class Web42Client:
    """Synchronous Web42 Auth client.

    Example::

        client = Web42Client(
            base_url="https://web42.ai",
            client_id="<client_id>",
            client_secret="<client_secret>",
        )

        info = client.introspect(bearer_token)
        if info.active:
            print(info.sub, info.email)
    """

    def __init__(
        self,
        base_url: str,
        client_id: str,
        client_secret: str,
        *,
        timeout: float = 5.0,
    ) -> None:
        self._auth = (client_id, client_secret)
        self._http = httpx.Client(
            base_url=base_url.rstrip("/"),
            timeout=timeout,
        )

    def introspect(self, token: str) -> TokenInfo:
        """Introspect a user bearer token.

        Always returns a :class:`TokenInfo`.  Check ``info.active`` before
        trusting any other field.

        Raises :class:`Web42AuthError` on HTTP 4xx/5xx from the auth service.
        """
        try:
            resp = self._http.post(
                "/introspect",
                data={"token": token},
                auth=self._auth,
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise Web42AuthError(
                f"Auth service error: {exc.response.status_code}",
                exc.response.status_code,
            ) from exc
        return TokenInfo._from_dict(resp.json())

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "Web42Client":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()


class AsyncWeb42Client:
    """Async Web42 Auth client (for asyncio frameworks like FastAPI).

    Example::

        client = AsyncWeb42Client(
            base_url="https://web42.ai",
            client_id="<client_id>",
            client_secret="<client_secret>",
        )

        info = await client.introspect(bearer_token)
        if info.active:
            print(info.sub, info.email)
    """

    def __init__(
        self,
        base_url: str,
        client_id: str,
        client_secret: str,
        *,
        timeout: float = 5.0,
    ) -> None:
        self._auth = (client_id, client_secret)
        self._http = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=timeout,
        )

    async def introspect(self, token: str) -> TokenInfo:
        """Introspect a user bearer token (async).

        Raises :class:`Web42AuthError` on HTTP 4xx/5xx from the auth service.
        """
        try:
            resp = await self._http.post(
                "/introspect",
                data={"token": token},
                auth=self._auth,
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise Web42AuthError(
                f"Auth service error: {exc.response.status_code}",
                exc.response.status_code,
            ) from exc
        return TokenInfo._from_dict(resp.json())

    async def close(self) -> None:
        await self._http.aclose()

    async def __aenter__(self) -> "AsyncWeb42Client":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()
