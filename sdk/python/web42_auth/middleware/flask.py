"""Flask decorator for Web42 token introspection.

Usage::

    from flask import Flask, g, jsonify
    from web42_auth import Web42Client
    from web42_auth.middleware.flask import require_token

    app = Flask(__name__)
    w42 = Web42Client(
        base_url=os.environ["WEB42_AUTH_URL"],
        client_id=os.environ["WEB42_CLIENT_ID"],
        client_secret=os.environ["WEB42_CLIENT_SECRET"],
    )

    @app.get("/protected")
    @require_token(w42)
    def protected():
        # g.token_info is populated
        return jsonify({"user": g.token_info.sub, "email": g.token_info.email})
"""
from __future__ import annotations

from functools import wraps
from typing import Callable

from flask import Response, g, jsonify, request

from ..client import Web42AuthError, Web42Client


def require_token(client: Web42Client) -> Callable:
    """Decorator factory that guards a Flask route with Web42 token introspection.

    On success, the validated :class:`~web42_auth.TokenInfo` is stored on
    ``flask.g.token_info`` for use inside the route.

    Args:
        client: An :class:`~web42_auth.Web42Client` instance.

    Returns:
        A decorator that can be applied to Flask view functions.
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(*args: object, **kwargs: object) -> Response:
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing Bearer token"}), 401  # type: ignore[return-value]

            token = auth_header[len("Bearer "):]

            try:
                info = client.introspect(token)
            except Web42AuthError:
                return jsonify({"error": "Auth service unavailable"}), 503  # type: ignore[return-value]

            if not info.active:
                return jsonify({"error": "Token inactive or revoked"}), 401  # type: ignore[return-value]

            g.token_info = info
            return f(*args, **kwargs)

        return wrapper

    return decorator
