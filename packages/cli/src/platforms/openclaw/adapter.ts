import { createHash } from "crypto"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs"
import { dirname, join, resolve } from "path"
import { homedir } from "os"
import { glob } from "glob"

import type {
  ConfigVariable,
  InitConfig,
  InstalledAgent,
  InstallOptions,
  InstallResult,
  PackOptions,
  PackResult,
  PackedFile,
  PlatformAdapter,
  UninstallOptions,
  UninstallResult,
} from "../base.js"
import { stripSecrets, stripChannelSecrets } from "../../utils/secrets.js"
import { USER_MD } from "./templates.js"

const OPENCLAW_HOME = join(homedir(), ".openclaw")
const OPENCLAW_CONFIG_PATH = join(OPENCLAW_HOME, "openclaw.json")

const HARDCODED_EXCLUDES = [
  "auth-profiles.json",
  "MEMORY.md",
  "memory/**",
  "sessions/**",
  ".git/**",
  "node_modules/**",
  ".DS_Store",
  "*.log",
  "openclaw.json",
  ".openclaw/credentials/**",
  ".web42/**",
  ".web42ignore",
  "manifest.json",
  "USER.md",
]

const TEMPLATE_VARS: Array<[RegExp, string]> = [
  [/\/Users\/[^/]+\/.openclaw/g, "{{OPENCLAW_HOME}}"],
  [/\/home\/[^/]+\/.openclaw/g, "{{OPENCLAW_HOME}}"],
  [/C:\\Users\\[^\\]+\\.openclaw/g, "{{OPENCLAW_HOME}}"],
  [/~\/.openclaw/g, "{{OPENCLAW_HOME}}"],
]

function sanitizeContent(content: string): string {
  let result = content
  for (const [pattern, replacement] of TEMPLATE_VARS) {
    result = result.replace(pattern, replacement)
  }
  return result
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

function expandHome(p: string): string {
  if (p.startsWith("~/")) return join(homedir(), p.slice(2))
  if (p.startsWith("~")) return join(homedir(), p.slice(1))
  return p
}

function normalizePath(p: string): string {
  return resolve(expandHome(p))
}

function findAgentEntry(
  agentsList: Array<Record<string, unknown>>,
  cwd: string
): Record<string, unknown> | null {
  const resolvedCwd = resolve(cwd)
  for (const agent of agentsList) {
    if (typeof agent.workspace === "string") {
      if (normalizePath(agent.workspace) === resolvedCwd) {
        return agent
      }
    }
  }
  return null
}

interface ExtractedAgentConfig {
  agent: Record<string, unknown>
  bindings: Array<Record<string, unknown>>
  skills: Record<string, unknown>
  channels: Record<string, unknown>
  tools: Record<string, unknown>
  [key: string]: unknown
}

interface ConfigExtractionResult {
  configTemplate: ExtractedAgentConfig
  configVariables: ConfigVariable[]
}

function extractAgentConfig(cwd: string): ConfigExtractionResult | null {
  if (!existsSync(OPENCLAW_CONFIG_PATH)) return null

  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(readFileSync(OPENCLAW_CONFIG_PATH, "utf-8"))
  } catch {
    return null
  }

  const agentsList = (raw.agents as Record<string, unknown>)?.list as
    | Array<Record<string, unknown>>
    | undefined
  if (!Array.isArray(agentsList) || agentsList.length === 0) return null

  const agentEntry = findAgentEntry(agentsList, cwd)
  if (!agentEntry) return null

  const agentId = (agentEntry.id as string) ?? ""

  const { workspace: _ws, agentDir: _ad, ...agentFields } = agentEntry

  const allBindings = (raw.bindings as Array<Record<string, unknown>>) ?? []
  const agentBindings = allBindings
    .filter((b) => b.agentId === agentId)
    .map(({ agentId: _id, ...rest }) => rest)

  const allSkills = (raw.skills as Record<string, unknown>) ?? {}
  const extractedSkills: Record<string, unknown> = JSON.parse(
    JSON.stringify(allSkills)
  )

  // Extract channel configs referenced by this agent's bindings
  const extractedChannels: Record<string, unknown> = {}
  const rawChannels = (raw.channels as Record<string, unknown>) ?? {}

  for (const binding of agentBindings) {
    const channel = binding.channel as string | undefined
    if (!channel) continue
    const accountId = (binding.accountId as string) ?? undefined

    if (!rawChannels[channel]) continue
    const channelConfig = rawChannels[channel] as Record<string, unknown>

    if (!extractedChannels[channel]) {
      const { accounts: _accts, ...channelLevel } = channelConfig
      extractedChannels[channel] = { ...channelLevel, accounts: {} }
    }

    if (accountId) {
      const accounts = (channelConfig.accounts as Record<string, unknown>) ?? {}
      if (accounts[accountId]) {
        const extracted = extractedChannels[channel] as Record<string, unknown>
        const extractedAccounts = extracted.accounts as Record<string, unknown>
        extractedAccounts[accountId] = JSON.parse(
          JSON.stringify(accounts[accountId])
        )
      }
    }
  }

  // Extract global tools config if this agent is referenced
  let extractedTools: Record<string, unknown> = {}
  const rawTools = (raw.tools as Record<string, unknown>) ?? {}
  if (rawTools.agentToAgent && typeof rawTools.agentToAgent === "object") {
    const a2a = rawTools.agentToAgent as Record<string, unknown>
    const allowList = (a2a.allow as string[]) ?? []
    if (Array.isArray(allowList) && allowList.includes(agentId)) {
      extractedTools = JSON.parse(JSON.stringify(rawTools))
    }
  }

  const configTemplate: ExtractedAgentConfig = {
    agent: agentFields,
    bindings: agentBindings,
    skills: extractedSkills,
    channels: extractedChannels,
    tools: extractedTools,
  }

  const configVariables = stripSecrets(extractedSkills)
  const channelVars = stripChannelSecrets(
    extractedChannels as Record<string, unknown>
  )
  configVariables.push(...channelVars)

  return { configTemplate, configVariables }
}

// --- Install helpers ---

function resolveTemplateVars(content: string, workspacePath: string): string {
  return content
    .replace(/\{\{OPENCLAW_HOME\}\}/g, OPENCLAW_HOME)
    .replace(/\{\{WORKSPACE\}\}/g, workspacePath)
}

function replaceConfigPlaceholders(
  content: string,
  answers: Record<string, string>
): string {
  let result = content
  for (const [key, value] of Object.entries(answers)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
  }
  return result
}

function generateAgentId(slug: string, existingIds: Set<string>): string {
  if (!existingIds.has(slug)) return slug
  let counter = 2
  while (existingIds.has(`${slug}-${counter}`)) counter++
  return `${slug}-${counter}`
}

function mergeOpenclawConfig(
  openclawConfig: Record<string, unknown>,
  configTemplate: Record<string, unknown>,
  agentSlug: string,
  username: string,
  workspacePath: string,
  configAnswers: Record<string, string>
): void {
  if (!openclawConfig.agents) {
    openclawConfig.agents = { list: [] }
  }
  const agents = openclawConfig.agents as Record<string, unknown>
  if (!Array.isArray(agents.list)) {
    agents.list = []
  }
  const agentsList = agents.list as Array<Record<string, unknown>>

  const existingIds = new Set(
    agentsList.map((a) => String(a.id ?? a.name ?? ""))
  )
  const agentId = generateAgentId(agentSlug, existingIds)

  const templateAgent =
    (configTemplate.agent as Record<string, unknown>) ?? {}
  const agentEntry: Record<string, unknown> = {
    ...templateAgent,
    id: agentId,
    workspace: workspacePath,
    agentDir: join(OPENCLAW_HOME, "agents", agentId, "agent"),
  }

  const existingIdx = agentsList.findIndex(
    (a) => a.id === agentId || a.name === agentSlug
  )
  if (existingIdx >= 0) {
    agentsList[existingIdx] = agentEntry
  } else {
    agentsList.push(agentEntry)
  }

  const templateBindings =
    (configTemplate.bindings as Array<Record<string, unknown>>) ?? []
  if (templateBindings.length > 0) {
    if (!Array.isArray(openclawConfig.bindings)) {
      openclawConfig.bindings = []
    }
    const bindings = openclawConfig.bindings as Array<Record<string, unknown>>
    for (const binding of templateBindings) {
      bindings.push({ ...binding, agentId })
    }
  }

  const templateSkills =
    (configTemplate.skills as Record<string, unknown>) ?? {}
  const templateSkillEntries =
    (templateSkills.entries as Record<string, unknown>) ?? {}
  if (Object.keys(templateSkillEntries).length > 0) {
    if (!openclawConfig.skills || typeof openclawConfig.skills !== "object") {
      openclawConfig.skills = {}
    }
    const skills = openclawConfig.skills as Record<string, unknown>
    if (!skills.entries || typeof skills.entries !== "object") {
      skills.entries = {}
    }
    const entries = skills.entries as Record<string, unknown>
    for (const [name, cfg] of Object.entries(templateSkillEntries)) {
      if (!entries[name]) {
        entries[name] = cfg
      }
    }
  }

  // Merge channels
  const templateChannels =
    (configTemplate.channels as Record<string, unknown>) ?? {}
  if (Object.keys(templateChannels).length > 0) {
    if (
      !openclawConfig.channels ||
      typeof openclawConfig.channels !== "object"
    ) {
      openclawConfig.channels = {}
    }
    const channels = openclawConfig.channels as Record<string, unknown>

    for (const [channelName, channelVal] of Object.entries(templateChannels)) {
      if (!channelVal || typeof channelVal !== "object") continue
      const templateChannel = channelVal as Record<string, unknown>

      if (!channels[channelName] || typeof channels[channelName] !== "object") {
        channels[channelName] = {}
      }
      const existingChannel = channels[channelName] as Record<string, unknown>

      // Copy channel-level settings only if not already set
      for (const [key, val] of Object.entries(templateChannel)) {
        if (key === "accounts") continue
        if (existingChannel[key] === undefined) {
          existingChannel[key] = val
        }
      }

      // Merge accounts (don't overwrite existing)
      const templateAccounts =
        (templateChannel.accounts as Record<string, unknown>) ?? {}
      if (Object.keys(templateAccounts).length > 0) {
        if (
          !existingChannel.accounts ||
          typeof existingChannel.accounts !== "object"
        ) {
          existingChannel.accounts = {}
        }
        const existingAccounts = existingChannel.accounts as Record<
          string,
          unknown
        >
        for (const [accountId, accountVal] of Object.entries(
          templateAccounts
        )) {
          if (!existingAccounts[accountId]) {
            existingAccounts[accountId] = accountVal
          }
        }
      }
    }
  }

  // Merge tools
  const templateTools =
    (configTemplate.tools as Record<string, unknown>) ?? {}
  if (Object.keys(templateTools).length > 0) {
    if (!openclawConfig.tools || typeof openclawConfig.tools !== "object") {
      openclawConfig.tools = {}
    }
    const tools = openclawConfig.tools as Record<string, unknown>

    // Merge agentToAgent allow list
    const templateA2A =
      (templateTools.agentToAgent as Record<string, unknown>) ?? {}
    if (Object.keys(templateA2A).length > 0) {
      if (!tools.agentToAgent || typeof tools.agentToAgent !== "object") {
        tools.agentToAgent = {}
      }
      const a2a = tools.agentToAgent as Record<string, unknown>
      if (templateA2A.enabled !== undefined && a2a.enabled === undefined) {
        a2a.enabled = templateA2A.enabled
      }
      const templateAllow = (templateA2A.allow as string[]) ?? []
      if (templateAllow.length > 0) {
        if (!Array.isArray(a2a.allow)) a2a.allow = []
        const existingAllow = new Set(a2a.allow as string[])
        for (const id of templateAllow) {
          const resolvedId = id === agentId ? agentId : id
          if (!existingAllow.has(resolvedId)) {
            ;(a2a.allow as string[]).push(resolvedId)
          }
        }
      }
    }
  }

  const serialized = replaceConfigPlaceholders(
    JSON.stringify(openclawConfig),
    configAnswers
  )
  const parsed = JSON.parse(serialized) as Record<string, unknown>
  Object.assign(openclawConfig, parsed)
}

// --- Adapter ---

export class OpenClawAdapter implements PlatformAdapter {
  name = "openclaw"
  home = OPENCLAW_HOME

  extractInitConfig(cwd: string): InitConfig | null {
    if (!existsSync(OPENCLAW_CONFIG_PATH)) return null

    let raw: Record<string, unknown>
    try {
      raw = JSON.parse(readFileSync(OPENCLAW_CONFIG_PATH, "utf-8"))
    } catch {
      return null
    }

    const agents = raw.agents as Record<string, unknown> | undefined
    const agentsList = agents?.list as Array<Record<string, unknown>> | undefined
    if (!Array.isArray(agentsList) || agentsList.length === 0) return null

    const agentEntry = findAgentEntry(agentsList, cwd)
    if (!agentEntry) return null

    const name = String(agentEntry.id ?? "")
    if (!name) return null

    const model =
      (agentEntry.model as string) ??
      ((agents?.defaults as Record<string, unknown>)?.model as Record<string, unknown>)?.primary as string | undefined

    return { name, model: model || undefined }
  }

  async listInstalled(): Promise<InstalledAgent[]> {
    const configPath = join(OPENCLAW_HOME, "openclaw.json")
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, "utf-8"))
        if (Array.isArray(config.agents?.list) && config.agents.list.length > 0) {
          return config.agents.list.map((a: Record<string, unknown>) => ({
            name: String(a.name ?? a.id ?? "unknown"),
            source: a.source ? String(a.source) : undefined,
            workspace: String(a.workspace ?? ""),
          }))
        }
      } catch {
        // Fall through to directory scan
      }
    }

    if (!existsSync(OPENCLAW_HOME)) return []

    return readdirSync(OPENCLAW_HOME)
      .filter((d) => d.startsWith("workspace-"))
      .map((d) => ({
        name: d.replace("workspace-", ""),
        workspace: join(OPENCLAW_HOME, d),
      }))
  }

  async uninstall(options: UninstallOptions): Promise<UninstallResult> {
    const { agentName } = options
    const removedPaths: string[] = []

    const workspacePath = join(OPENCLAW_HOME, `workspace-${agentName}`)
    if (existsSync(workspacePath)) {
      rmSync(workspacePath, { recursive: true, force: true })
      removedPaths.push(workspacePath)
    }

    const agentDir = join(OPENCLAW_HOME, "agents", agentName)
    if (existsSync(agentDir)) {
      rmSync(agentDir, { recursive: true, force: true })
      removedPaths.push(agentDir)
    }

    const configPath = join(OPENCLAW_HOME, "openclaw.json")
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, "utf-8"))

        if (Array.isArray(config.agents?.list)) {
          config.agents.list = config.agents.list.filter(
            (a: Record<string, unknown>) =>
              a.id !== agentName && a.name !== agentName
          )
        }

        if (Array.isArray(config.bindings)) {
          config.bindings = config.bindings.filter(
            (b: Record<string, unknown>) => b.agentId !== agentName
          )
        }

        writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
      } catch {
        // Config is corrupted, skip cleanup
      }
    }

    return { removed: removedPaths.length > 0, paths: removedPaths }
  }

  async pack(options: PackOptions): Promise<PackResult> {
    const { cwd } = options

    const ignorePatterns = [...HARDCODED_EXCLUDES]
    const web42ignorePath = join(cwd, ".web42ignore")
    if (existsSync(web42ignorePath)) {
      const ignoreContent = readFileSync(web42ignorePath, "utf-8")
      ignoreContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .forEach((pattern) => ignorePatterns.push(pattern))
    }

    const allFiles = await glob("**/*", {
      cwd,
      nodir: true,
      ignore: ignorePatterns,
      dot: true,
    })

    const files: PackedFile[] = []

    for (const filePath of allFiles) {
      const fullPath = join(cwd, filePath)
      const stat = statSync(fullPath)

      if (stat.size > 1024 * 1024) continue

      try {
        let content = readFileSync(fullPath, "utf-8")
        content = sanitizeContent(content)
        files.push({ path: filePath, content, hash: hashContent(content) })
      } catch {
        // Skip binary files
      }
    }

    const extraction = extractAgentConfig(cwd)
    let configTemplate: Record<string, unknown> | null = null
    let configVariables: ConfigVariable[] = []

    if (extraction) {
      const configContent = JSON.stringify(extraction.configTemplate, null, 2)
      const sanitized = sanitizeContent(configContent)
      files.push({
        path: ".openclaw/config.json",
        content: sanitized,
        hash: hashContent(sanitized),
      })
      configTemplate = extraction.configTemplate
      configVariables = extraction.configVariables
    }

    return { files, configTemplate, configVariables }
  }

  async install(options: InstallOptions): Promise<InstallResult> {
    const {
      agentSlug,
      username,
      workspacePath,
      files,
      configTemplate,
      configAnswers,
    } = options

    mkdirSync(workspacePath, { recursive: true })

    let filesWritten = 0

    for (const file of files) {
      if (file.path === ".openclaw/config.json") continue

      const filePath = join(workspacePath, file.path)
      mkdirSync(dirname(filePath), { recursive: true })

      if (file.content !== null && file.content !== undefined) {
        const resolved = resolveTemplateVars(file.content, workspacePath)
        writeFileSync(filePath, resolved, "utf-8")
      } else {
        writeFileSync(
          filePath,
          `# Placeholder - content not available\n# File: ${file.path}\n# Hash: ${file.content_hash}\n`
        )
      }
      filesWritten++
    }

    const openclawConfigPath = join(OPENCLAW_HOME, "openclaw.json")
    let openclawConfig: Record<string, unknown> = {}

    if (existsSync(openclawConfigPath)) {
      try {
        openclawConfig = JSON.parse(
          readFileSync(openclawConfigPath, "utf-8")
        )
      } catch {
        openclawConfig = {}
      }
    }

    if (configTemplate) {
      mergeOpenclawConfig(
        openclawConfig,
        configTemplate,
        agentSlug,
        username,
        workspacePath,
        configAnswers
      )
    } else {
      if (!openclawConfig.agents) openclawConfig.agents = { list: [] }
      const agents = openclawConfig.agents as Record<string, unknown>
      if (!Array.isArray(agents.list)) agents.list = []
      const agentsList = agents.list as Array<Record<string, unknown>>

      const existingIdx = agentsList.findIndex(
        (a) => a.id === agentSlug || a.name === agentSlug
      )
      const entry = {
        id: agentSlug,
        name: agentSlug,
        workspace: workspacePath,
        agentDir: join(OPENCLAW_HOME, "agents", agentSlug, "agent"),
      }
      if (existingIdx >= 0) {
        agentsList[existingIdx] = entry
      } else {
        agentsList.push(entry)
      }
    }

    const agentDir = join(OPENCLAW_HOME, "agents", agentSlug, "agent")
    mkdirSync(agentDir, { recursive: true })

    writeFileSync(
      openclawConfigPath,
      JSON.stringify(openclawConfig, null, 2) + "\n"
    )

    writeFileSync(join(workspacePath, "USER.md"), USER_MD, "utf-8")
    filesWritten++

    return { filesWritten, agentDir }
  }
}

export const openclawAdapter = new OpenClawAdapter()
