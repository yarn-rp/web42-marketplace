export interface Platform {
  id: string
  name: string
  url: string
  logo: string
  logoDark?: string
  comingSoon?: boolean
  installCommand: (username: string, slug: string) => string
}

const PLATFORMS = new Map<string, Platform>([
  [
    "openclaw",
    {
      id: "openclaw",
      name: "OpenClaw",
      url: "https://openclaw.ai",
      logo: "/assets/platforms/openclaw.svg",
      installCommand: (username, slug) =>
        `web42 openclaw install @${username}/${slug}`,
    },
  ],
  [
    "opencode",
    {
      id: "opencode",
      name: "OpenCode",
      url: "https://opencode.ai",
      logo: "/assets/platforms/opencode.svg",
      comingSoon: true,
      installCommand: (username, slug) =>
        `web42 opencode install @${username}/${slug}`,
    },
  ],
  [
    "claude",
    {
      id: "claude",
      name: "Claude",
      url: "https://claude.ai",
      logo: "/assets/platforms/claude.svg",
      installCommand: (username, slug) =>
        `web42 claude install @${username}/${slug}`,
    },
  ],
  [
    "codex",
    {
      id: "codex",
      name: "Codex",
      url: "https://openai.com/codex",
      logo: "/assets/platforms/codex.svg",
      logoDark: "/assets/platforms/codex-dark.svg",
      comingSoon: true,
      installCommand: (username, slug) =>
        `web42 codex install @${username}/${slug}`,
    },
  ],
])

export function getPlatform(id: string | undefined): Platform | undefined {
  if (!id) return undefined
  return PLATFORMS.get(id)
}

export function getAllPlatforms(): Platform[] {
  return [...PLATFORMS.values()]
}

export function getActivePlatforms(): Platform[] {
  return [...PLATFORMS.values()].filter((p) => !p.comingSoon)
}

export function getComingSoonPlatforms(): Platform[] {
  return [...PLATFORMS.values()].filter((p) => p.comingSoon)
}

export function getInstallCommand(
  platform: string | undefined,
  username: string,
  slug: string
): string {
  const p = getPlatform(platform)
  if (p) return p.installCommand(username, slug)
  return `web42 install @${username}/${slug}`
}
