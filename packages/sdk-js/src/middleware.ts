/**
 * Framework middleware helpers.
 *
 * - Express: createExpressMiddleware
 * - Generic fetch handler (Next.js, Hono, Fastify, etc.): createTokenGuard
 */

import type { NextFunction, Request, Response } from "express";
import { Web42AuthError, Web42Client, TokenInfo } from "./client.js";

// ---------------------------------------------------------------------------
// Express
// ---------------------------------------------------------------------------

/** Augment Express's Request so `req.tokenInfo` is typed. */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tokenInfo?: TokenInfo;
    }
  }
}

export interface ExpressMiddlewareOptions {
  /**
   * Custom token extractor.  Defaults to reading the `Authorization: Bearer <token>` header.
   */
  getToken?: (req: Request) => string | undefined;
  /**
   * Called when the auth service itself returns an error (network/5xx).
   * Defaults to responding 503.
   */
  onError?: (err: Web42AuthError, req: Request, res: Response, next: NextFunction) => void;
}

/**
 * Express middleware that validates a Web42 Bearer token on every request.
 *
 * On success, populates `req.tokenInfo` and calls `next()`.
 * On failure, responds 401 (or 503 if the auth service is unavailable).
 *
 * @example
 * import express from "express";
 * import { Web42Client, createExpressMiddleware } from "@web42/auth";
 *
 * const w42 = new Web42Client({ baseUrl, clientId, clientSecret });
 * const app = express();
 * app.use(createExpressMiddleware(ioa));
 *
 * app.get("/protected", (req, res) => {
 *   res.json({ user: req.tokenInfo!.sub });
 * });
 */
export function createExpressMiddleware(
  client: Web42Client,
  options: ExpressMiddlewareOptions = {},
) {
  const getToken =
    options.getToken ??
    ((req: Request) => {
      const auth = req.headers.authorization ?? "";
      return auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
    });

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = getToken(req);

    if (!token) {
      res.status(401).json({ error: "Missing Bearer token" });
      return;
    }

    let info: TokenInfo;
    try {
      info = await client.introspect(token);
    } catch (err) {
      if (options.onError) {
        options.onError(err as Web42AuthError, req, res, next);
      } else {
        res.status(503).json({ error: "Auth service unavailable" });
      }
      return;
    }

    if (!info.active) {
      res.status(401).json({ error: "Token inactive or revoked" });
      return;
    }

    req.tokenInfo = info;
    next();
  };
}

// ---------------------------------------------------------------------------
// Generic guard — usable in Next.js Route Handlers, Hono, Fastify, etc.
// ---------------------------------------------------------------------------

export type TokenGuardResult =
  | { ok: true; tokenInfo: TokenInfo }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Framework-agnostic token guard.  Extract the Bearer token yourself, pass it
 * in, and handle the result however your framework expects.
 *
 * @example Next.js App Router
 * import { NextRequest, NextResponse } from "next/server";
 * import { Web42Client, checkToken } from "@web42/auth";
 *
 * const w42 = new Web42Client({ ... });
 *
 * export async function GET(req: NextRequest) {
 *   const result = await checkToken(ioa, req.headers.get("authorization"));
 *   if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
 *   return NextResponse.json({ user: result.tokenInfo.sub });
 * }
 */
export async function checkToken(
  client: Web42Client,
  authorizationHeader: string | null | undefined,
): Promise<TokenGuardResult> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing Bearer token" };
  }

  const token = authorizationHeader.slice(7);

  let info: TokenInfo;
  try {
    info = await client.introspect(token);
  } catch {
    return { ok: false, status: 503, error: "Auth service unavailable" };
  }

  if (!info.active) {
    return { ok: false, status: 401, error: "Token inactive or revoked" };
  }

  return { ok: true, tokenInfo: info };
}
