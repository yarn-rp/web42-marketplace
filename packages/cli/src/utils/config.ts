import Conf from "conf"

interface Web42Config {
  apiUrl: string
  userId?: string
  username?: string
  fullName?: string
  avatarUrl?: string
  token?: string
  authenticated: boolean
}

const config = new Conf<Web42Config>({
  projectName: "web42",
  defaults: {
    apiUrl: "https://web42.ai",
    authenticated: false,
  },
})

export function getConfig(): Web42Config {
  return {
    apiUrl: config.get("apiUrl"),
    userId: config.get("userId"),
    username: config.get("username"),
    fullName: config.get("fullName"),
    avatarUrl: config.get("avatarUrl"),
    token: config.get("token"),
    authenticated: config.get("authenticated"),
  }
}

export function setAuth(data: {
  userId: string
  username: string
  token: string
  fullName?: string
  avatarUrl?: string
}) {
  config.set("userId", data.userId)
  config.set("username", data.username)
  config.set("token", data.token)
  if (data.fullName) config.set("fullName", data.fullName)
  if (data.avatarUrl) config.set("avatarUrl", data.avatarUrl)
  config.set("authenticated", true)
}

export function clearAuth() {
  config.delete("userId")
  config.delete("username")
  config.delete("fullName")
  config.delete("avatarUrl")
  config.delete("token")
  config.set("authenticated", false)
}

export function setApiUrl(url: string) {
  config.set("apiUrl", url)
}

export function isAuthenticated(): boolean {
  return config.get("authenticated") === true && !!config.get("userId") && !!config.get("token")
}

export function requireAuth(): Web42Config {
  const cfg = getConfig()
  if (!cfg.authenticated || !cfg.userId || !cfg.token) {
    throw new Error(
      "Not authenticated. Run `web42 auth login` first."
    )
  }
  return cfg
}

// Generic key/value store for arbitrary CLI state (e.g. A2A contextIds)
export function setConfigValue(key: string, value: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(config as any).set(key, value)
}

export function getConfigValue(key: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (config as any).get(key) as string | undefined
}
