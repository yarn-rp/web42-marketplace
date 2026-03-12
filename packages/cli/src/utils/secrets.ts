import type { ConfigVariable } from "../platforms/base.js"

interface SecretLocation {
  obj: Record<string, unknown>
  key: string
  varKey: string
  label: string
}

/**
 * Walks known secret paths in skill entries and collects locations to strip.
 * Returns locations for apiKey fields and env vars in each skill entry.
 */
export function collectSkillSecrets(
  skills: Record<string, unknown>
): SecretLocation[] {
  const secrets: SecretLocation[] = []

  const entries = (skills as Record<string, unknown>).entries as
    | Record<string, unknown>
    | undefined
  if (!entries || typeof entries !== "object") return secrets

  for (const [skillName, skillVal] of Object.entries(entries)) {
    if (!skillVal || typeof skillVal !== "object") continue
    const skill = skillVal as Record<string, unknown>

    if (typeof skill.apiKey === "string" && skill.apiKey) {
      secrets.push({
        obj: skill,
        key: "apiKey",
        varKey: `${skillName.toUpperCase().replace(/-/g, "_")}_API_KEY`,
        label: `API key for ${skillName} skill`,
      })
    }

    const env = skill.env as Record<string, unknown> | undefined
    if (env && typeof env === "object") {
      for (const [envKey, envVal] of Object.entries(env)) {
        if (typeof envVal === "string" && envVal) {
          secrets.push({
            obj: env,
            key: envKey,
            varKey: `${skillName.toUpperCase().replace(/-/g, "_")}_${envKey}`,
            label: `${envKey} for ${skillName} skill`,
          })
        }
      }
    }
  }

  return secrets
}

/**
 * Replaces secret values in-place with {{PLACEHOLDER}} vars and returns
 * the corresponding ConfigVariable entries for the manifest.
 */
export function stripSecrets(
  skills: Record<string, unknown>
): ConfigVariable[] {
  const locations = collectSkillSecrets(skills)
  const configVariables: ConfigVariable[] = []

  for (const loc of locations) {
    loc.obj[loc.key] = `{{${loc.varKey}}}`
    configVariables.push({
      key: loc.varKey,
      label: loc.label,
      required: true,
    })
  }

  return configVariables
}

const KNOWN_CHANNEL_SECRET_KEYS = new Set([
  "token",
  "botToken",
  "apiKey",
  "secret",
  "webhookSecret",
])

/**
 * Walks extracted channel configs and strips known secret fields.
 * Replaces values in-place with {{PLACEHOLDER}} vars and returns ConfigVariable entries.
 */
export function stripChannelSecrets(
  channels: Record<string, unknown>
): ConfigVariable[] {
  const configVariables: ConfigVariable[] = []

  for (const [channelName, channelVal] of Object.entries(channels)) {
    if (!channelVal || typeof channelVal !== "object") continue
    const channel = channelVal as Record<string, unknown>

    const accounts = channel.accounts as Record<string, unknown> | undefined
    if (!accounts || typeof accounts !== "object") continue

    for (const [accountId, accountVal] of Object.entries(accounts)) {
      if (!accountVal || typeof accountVal !== "object") continue
      const account = accountVal as Record<string, unknown>

      for (const [key, val] of Object.entries(account)) {
        if (typeof val !== "string" || !val) continue

        const isKnownSecret = KNOWN_CHANNEL_SECRET_KEYS.has(key)
        const isHeuristicSecret = !isKnownSecret && looksLikeSecret(val)

        if (isKnownSecret || isHeuristicSecret) {
          const suffix = key.toUpperCase()
          const varKey = `${channelName.toUpperCase()}_${accountId.toUpperCase()}_${suffix}`
          account[key] = `{{${varKey}}}`
          configVariables.push({
            key: varKey,
            label: `${key} for ${channelName}/${accountId} channel`,
            required: true,
          })
        }
      }
    }
  }

  return configVariables
}

const TOKEN_PATTERN = /^[A-Za-z0-9_\-]{20,}$/

/**
 * Heuristic scan: returns true if a string looks like a secret token/key.
 */
export function looksLikeSecret(value: string): boolean {
  return TOKEN_PATTERN.test(value.trim())
}

/**
 * Scans a flat object for values that look like tokens/keys.
 * Returns the keys of suspicious values.
 */
export function scanForAccidentalSecrets(
  obj: Record<string, unknown>
): string[] {
  const suspicious: string[] = []
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string" && looksLikeSecret(val)) {
      suspicious.push(key)
    }
  }
  return suspicious
}
