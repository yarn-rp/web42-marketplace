"""FastAPI dependency for Web42 token introspection.

Usage::

    from fastapi import FastAPI, Depends
    from web42_auth import AsyncWeb42Client
    from web42_auth.middleware.fastapi import make_require_token

    app = FastAPI()
    w42 = AsyncWeb42Client(
        base_url=os.environ["WEB42_AUTH_URL"],
        client_id=os.environ["WEB42_CLIENT_ID"],
        client_secret=os.environ["WEB42_CLIENT_SECRET"],
    )
    require_token = make_require_token(w42)

    @app.get("/protected")
    async def protected(token_info = Depends(require_token)):
        return {"user": token_info.sub, "email": token_info.email}
"""
from __future__ import annotations

from typing import Callable, Optional

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..client import AsyncWeb42Client, Web42AuthError, TokenInfo

_bearer = HTTPBearer(auto_error=False)


def make_require_token(
    client: AsyncWeb42Client,
    *,
    auto_error: bool = True,
) -> Callable:
    """Return a FastAPI dependency that validates the Bearer token.

    If ``auto_error=True`` (default) the dependency raises HTTP 401 when the
    token is missing or inactive.  Set ``auto_error=False`` to receive
    ``None`` on unauthenticated requests instead.

    Args:
        client: An :class:`~web42_auth.AsyncWeb42Client` instance.
        auto_error: Whether to raise 401 automatically.

    Returns:
        A dependency callable suitable for ``Depends()``.
    """
    from fastapi import Depends

    async def _dep(
        creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    ) -> Optional[TokenInfo]:
        if creds is None:
            if auto_error:
                raise HTTPException(status_code=401, detail="Missing Bearer token")
            return None

        try:
            info = await client.introspect(creds.credentials)
        except Web42AuthError as exc:
            raise HTTPException(
                status_code=503,
                detail="Auth service unavailable",
            ) from exc

        if not info.active:
            if auto_error:
                raise HTTPException(status_code=401, detail="Token inactive or revoked")
            return None

        return info

    return _dep
