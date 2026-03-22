/**
 * Web42 Auth SDK — core client.
 *
 * Works in Node.js 18+, Deno, Bun, and modern browsers (uses native fetch).
 */

export interface TokenInfo {
  active: boolean;
  sub?: string;
  email?: string;
  /** "google" | "github" */
  provider?: string;
  exp?: number;
  iat?: number;
}

export interface Web42ClientOptions {
  /** Base URL of the Web42 Auth service, e.g. "https://web42.ai" */
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  /** Request timeout in milliseconds. Default: 5000 */
  timeout?: number;
}

export class Web42AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "Web42AuthError";
  }
}

export class Web42Client {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly timeout: number;

  constructor({ baseUrl, clientId, clientSecret, timeout = 5000 }: Web42ClientOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.authHeader = "Basic " + btoa(`${clientId}:${clientSecret}`);
    this.timeout = timeout;
  }

  /**
   * Introspect a user Bearer token (RFC 7662).
   *
   * Always resolves — check `result.active` before trusting other fields.
   * Rejects with `IoAAuthError` only on unexpected HTTP errors (4xx/5xx).
   *
   * @example
   * const info = await client.introspect(bearerToken);
   * if (!info.active) throw new Error("Token revoked or expired");
   * console.log(info.sub, info.email);
   */
  async introspect(token: string): Promise<TokenInfo> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/introspect`, {
        method: "POST",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === "AbortError") {
        throw new Web42AuthError("Auth service request timed out", 408);
      }
      throw new Web42AuthError(`Auth service unreachable: ${(err as Error).message}`, 503);
    }

    clearTimeout(timer);

    if (!res.ok) {
      throw new Web42AuthError(
        `Introspect failed: ${res.status} ${res.statusText}`,
        res.status,
      );
    }

    return res.json() as Promise<TokenInfo>;
  }
}
