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
import { stripForbiddenFrontmatter } from "./security.js"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLAUDE_HOME = join(homedir(), ".claude")

const HARDCODED_EXCLUDES = [
  ".claude/settings*",
  ".claude/settings.json",
  ".claude/settings.local.json",
  ".claude/projects/**",
  ".claude/plugins/**",
  "memory/**",
  "MEMORY.md",
  ".git/**",
  "node_modules/**",
  ".DS_Store",
  "*.log",
  ".web42/**",
  ".web42ignore",
  "manifest.json",
  ".env",
  ".env.*",
]

const TEMPLATE_VARS: Array<[RegExp, string]> = [
  [/\/Users\/[^/]+\/.claude/g, "{{CLAUDE_HOME}}"],
  [/\/home\/[^/]+\/.claude/g, "{{CLAUDE_HOME}}"],
  [/C:\\Users\\[^\\]+\\.claude/g, "{{CLAUDE_HOME}}"],
  [/~\/.claude/g, "{{CLAUDE_HOME}}"],
]

// ---------------------------------------------------------------------------
// Agent discovery types
// ---------------------------------------------------------------------------

export interface AgentCandidate {
  name: string
  description?: string
  model?: string
  skills: string[]
  path: string
}

export interface ResolvedSkill {
  name: string
  sourcePath: string
  found: boolean
}

interface InstalledEntry {
  source: string
  version: string
  installed_at: string
  files: string[]
}

type InstalledManifest = Record<string, InstalledEntry>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function resolveTemplateVars(content: string): string {
  return content.replace(/\{\{CLAUDE_HOME\}\}/g, CLAUDE_HOME)
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

/**
 * Parse YAML-like frontmatter from an agent .md file.
 * Handles simple key: value pairs and list values (skills, tools).
 */
function parseAgentFrontmatter(content: string): Record<string, string | string[]> {
  const lines = content.split("\n")
  if (lines[0]?.trim() !== "---") return {}

  const result: Record<string, string | string[]> = {}
  let currentKey: string | null = null

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === "---") break

    // Top-level key
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/)
    if (keyMatch) {
      const key = keyMatch[1]
      const value = keyMatch[2].trim()
      if (value) {
        result[key] = value.replace(/^["']|["']$/g, "")
      } else {
        result[key] = []
      }
      currentKey = key
      continue
    }

    // List item (indented - item)
    const listMatch = line.match(/^\s+-\s+(.+)$/) || line.match(/^\s+- (.+)$/)
    if (listMatch && currentKey) {
      const arr = result[currentKey]
      if (Array.isArray(arr)) {
        arr.push(listMatch[1].trim().replace(/^["']|["']$/g, ""))
      }
      continue
    }

    // Indented continuation — could be multiline value
    if (line.match(/^\s+/) && currentKey) {
      continue
    }
  }

  return result
}

function readInstalledManifest(root?: string): InstalledManifest {
  const base = root ?? CLAUDE_HOME
  const p = join(base, ".web42", "installed.json")
  if (!existsSync(p)) return {}
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as InstalledManifest
  } catch {
    return {}
  }
}

function writeInstalledManifest(root: string, manifest: InstalledManifest): void {
  const dir = join(root, ".web42")
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, "installed.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  )
}

/**
 * Check if a file was installed by web42 (tracked in installed.json).
 */
function isFileTracked(relativePath: string, installed: InstalledManifest): string | null {
  for (const [agentName, entry] of Object.entries(installed)) {
    if (entry.files.includes(relativePath)) {
      return agentName
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class ClaudeAdapter implements PlatformAdapter {
  name = "claude"
  home = CLAUDE_HOME

  /**
   * Discover agent .md files in known locations.
   */
  discoverAgents(cwd: string): AgentCandidate[] {
    const candidates: AgentCandidate[] = []
    const seen = new Set<string>()

    const searchDirs: string[] = []

    // 1. cwd/agents/ (standalone plugin dir or ~/.claude/)
    const cwdAgentsDir = join(cwd, "agents")
    if (existsSync(cwdAgentsDir)) {
      searchDirs.push(cwdAgentsDir)
    }

    // 2. cwd/.claude/agents/ (project-local agents)
    const projectAgentsDir = join(cwd, ".claude", "agents")
    if (existsSync(projectAgentsDir)) {
      searchDirs.push(projectAgentsDir)
    }

    // 3. ~/.claude/agents/ (global, if cwd isn't already ~/.claude/)
    const globalAgentsDir = join(CLAUDE_HOME, "agents")
    if (resolve(cwd) !== resolve(CLAUDE_HOME) && existsSync(globalAgentsDir)) {
      searchDirs.push(globalAgentsDir)
    }

    for (const dir of searchDirs) {
      try {
        const entries = readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isFile() || !entry.name.endsWith(".md")) continue

          const agentPath = join(dir, entry.name)
          const content = readFileSync(agentPath, "utf-8")
          const frontmatter = parseAgentFrontmatter(content)

          const name = (typeof frontmatter.name === "string" ? frontmatter.name : null)
            ?? entry.name.replace(/\.md$/, "")

          if (seen.has(name)) continue
          seen.add(name)

          const skills = Array.isArray(frontmatter.skills)
            ? frontmatter.skills
            : []

          candidates.push({
            name,
            description: typeof frontmatter.description === "string"
              ? frontmatter.description
              : undefined,
            model: typeof frontmatter.model === "string"
              ? frontmatter.model
              : undefined,
            skills,
            path: agentPath,
          })
        }
      } catch {
        // Directory not readable, skip
      }
    }

    return candidates
  }

  /**
   * Resolve skill directories from known locations.
   */
  resolveSkills(skillNames: string[], cwd: string): ResolvedSkill[] {
    return skillNames.map((name) => {
      const searchPaths = [
        join(cwd, "skills", name, "SKILL.md"),
        join(CLAUDE_HOME, "skills", name, "SKILL.md"),
        join(cwd, ".claude", "skills", name, "SKILL.md"),
      ]

      for (const p of searchPaths) {
        if (existsSync(p)) {
          return { name, sourcePath: dirname(p), found: true }
        }
      }

      return { name, sourcePath: "", found: false }
    })
  }

  extractInitConfig(cwd: string): InitConfig | null {
    const agents = this.discoverAgents(cwd)
    if (agents.length === 0) return null

    const first = agents[0]
    return {
      name: first.name,
      model: first.model || undefined,
    }
  }

  async pack(options: PackOptions): Promise<PackResult> {
    const { cwd, agentName } = options

    if (!agentName) {
      throw new Error(
        "Claude adapter requires agentName in PackOptions. " +
        "Use --agent <name> or let the pack command auto-discover agents."
      )
    }

    // Read the agent .md file (check cwd/agents/ and cwd/.claude/agents/)
    let agentMdPath = join(cwd, "agents", `${agentName}.md`)
    if (!existsSync(agentMdPath)) {
      agentMdPath = join(cwd, ".claude", "agents", `${agentName}.md`)
    }
    if (!existsSync(agentMdPath)) {
      throw new Error(`Agent file not found: agents/${agentName}.md or .claude/agents/${agentName}.md`)
    }

    const agentContent = readFileSync(agentMdPath, "utf-8")
    const frontmatter = parseAgentFrontmatter(agentContent)
    const skillNames = Array.isArray(frontmatter.skills) ? frontmatter.skills : []

    // Resolve skills
    const resolvedSkills = this.resolveSkills(skillNames, cwd)
    const missingSkills = resolvedSkills.filter((s) => !s.found)
    if (missingSkills.length > 0) {
      const names = missingSkills.map((s) => s.name).join(", ")
      console.warn(`Warning: Skills not found: ${names}`)
    }

    // Collect ignore patterns
    const ignorePatterns = [...HARDCODED_EXCLUDES]
    const web42Dir = join(cwd, ".web42")
    const agentWeb42Dir = join(web42Dir, agentName)
    const ignorePath = join(agentWeb42Dir, ".web42ignore")
    if (existsSync(ignorePath)) {
      const ignoreContent = readFileSync(ignorePath, "utf-8")
      ignoreContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .forEach((pattern) => ignorePatterns.push(pattern))
    }

    const files: PackedFile[] = []

    // 1. Add the agent .md itself
    const sanitizedAgent = sanitizeContent(agentContent)
    files.push({
      path: `agents/${agentName}.md`,
      content: sanitizedAgent,
      hash: hashContent(sanitizedAgent),
    })

    // 2. Add each resolved skill's full directory
    for (const skill of resolvedSkills) {
      if (!skill.found) continue

      const skillDir = skill.sourcePath
      const skillFiles = await glob("**/*", {
        cwd: skillDir,
        nodir: true,
        ignore: ignorePatterns,
        dot: true,
      })

      for (const filePath of skillFiles) {
        const fullPath = join(skillDir, filePath)
        const stat = statSync(fullPath)
        if (stat.size > 1024 * 1024) continue

        try {
          let content = readFileSync(fullPath, "utf-8")
          content = sanitizeContent(content)
          files.push({
            path: `skills/${skill.name}/${filePath}`,
            content,
            hash: hashContent(content),
          })
        } catch {
          // Skip binary files
        }
      }
    }

    // 3. Add commands/*.md if present (check cwd/commands/ and cwd/.claude/commands/)
    const commandsDirs = [
      join(cwd, "commands"),
      join(cwd, ".claude", "commands"),
    ]
    const seenCommands = new Set<string>()
    for (const commandsDir of commandsDirs) {
      if (!existsSync(commandsDir)) continue
      try {
        const commandFiles = readdirSync(commandsDir, { withFileTypes: true })
        for (const entry of commandFiles) {
          if (!entry.isFile() || !entry.name.endsWith(".md")) continue
          if (seenCommands.has(entry.name)) continue
          seenCommands.add(entry.name)
          const fullPath = join(commandsDir, entry.name)
          const stat = statSync(fullPath)
          if (stat.size > 1024 * 1024) continue

          try {
            let content = readFileSync(fullPath, "utf-8")
            content = sanitizeContent(content)
            files.push({
              path: `commands/${entry.name}`,
              content,
              hash: hashContent(content),
            })
          } catch {
            // Skip
          }
        }
      } catch {
        // Commands dir not readable
      }
    }

    // 4. Add scripts/** if present (check cwd/scripts/ and cwd/.claude/scripts/)
    const scriptsDir = join(cwd, "scripts")
    const claudeScriptsDir = join(cwd, ".claude", "scripts")
    const effectiveScriptsDir = existsSync(scriptsDir) ? scriptsDir : claudeScriptsDir
    if (existsSync(effectiveScriptsDir)) {
      const scriptFiles = await glob("**/*", {
        cwd: effectiveScriptsDir,
        nodir: true,
        ignore: ignorePatterns,
        dot: true,
      })
      for (const filePath of scriptFiles) {
        const fullPath = join(effectiveScriptsDir, filePath)
        const stat = statSync(fullPath)
        if (stat.size > 1024 * 1024) continue

        try {
          let content = readFileSync(fullPath, "utf-8")
          content = sanitizeContent(content)
          files.push({
            path: `scripts/${filePath}`,
            content,
            hash: hashContent(content),
          })
        } catch {
          // Skip binary files
        }
      }
    }

    // Detect config variables from {{VAR}} patterns in agent .md
    const configVariables: ConfigVariable[] = []
    const varPattern = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g
    const reservedVars = new Set(["CLAUDE_HOME", "WORKSPACE"])
    let match
    while ((match = varPattern.exec(agentContent)) !== null) {
      if (!reservedVars.has(match[1])) {
        configVariables.push({
          key: match[1],
          label: match[1].replace(/_/g, " ").toLowerCase(),
          required: true,
        })
      }
    }

    return {
      files,
      configTemplate: null,
      configVariables,
      ignorePatterns,
    }
  }

  async install(options: InstallOptions): Promise<InstallResult> {
    const { agentSlug, files, configAnswers, workspacePath } = options

    // workspacePath determines where files land:
    //   local install  → cwd/.claude/  (default)
    //   global install → ~/.claude/    (with -g flag)
    const targetRoot = workspacePath

    const installed = readInstalledManifest(targetRoot)
    const trackedFiles: string[] = []
    let filesWritten = 0

    for (const file of files) {
      // Validate no path traversal
      const normalized = resolve(targetRoot, file.path)
      if (!normalized.startsWith(resolve(targetRoot))) {
        throw new Error(`Path traversal detected: ${file.path}`)
      }

      // Check for conflicts with non-web42 files
      const targetPath = join(targetRoot, file.path)
      if (existsSync(targetPath)) {
        const tracker = isFileTracked(file.path, installed)
        if (!tracker && tracker !== agentSlug) {
          console.warn(`  Warning: Overwriting existing file: ${file.path}`)
        }
      }

      // Security filter for agent .md files
      let content = file.content ?? ""
      if (file.path.startsWith("agents/") && file.path.endsWith(".md")) {
        const { cleaned, stripped } = stripForbiddenFrontmatter(content)
        content = cleaned
        if (stripped.length > 0) {
          console.warn(
            `  Security: Stripped ${stripped.join(", ")} from ${file.path}`
          )
        }
      }

      // Resolve template vars and config placeholders
      content = resolveTemplateVars(content)
      content = replaceConfigPlaceholders(content, configAnswers)

      // Write the file
      mkdirSync(dirname(targetPath), { recursive: true })
      writeFileSync(targetPath, content, "utf-8")
      trackedFiles.push(file.path)
      filesWritten++
    }

    // Update installed.json
    writeInstalledManifest(targetRoot, {
      ...readInstalledManifest(targetRoot),
      [agentSlug]: {
        source: `@${options.username}/${agentSlug}`,
        version: "1.0.0",
        installed_at: new Date().toISOString(),
        files: trackedFiles,
      },
    })

    return { filesWritten, agentDir: targetRoot }
  }

  async uninstall(options: UninstallOptions): Promise<UninstallResult> {
    const { agentName, workspacePath } = options
    const targetRoot = workspacePath ?? CLAUDE_HOME
    const installed = readInstalledManifest(targetRoot)
    const entry = installed[agentName]

    if (!entry) {
      return { removed: false, paths: [] }
    }

    const removedPaths: string[] = []

    // Remove each tracked file
    for (const filePath of entry.files) {
      const fullPath = join(targetRoot, filePath)
      if (existsSync(fullPath)) {
        rmSync(fullPath)
        removedPaths.push(fullPath)

        // Clean up empty parent directories (e.g., empty skill dirs)
        let parentDir = dirname(fullPath)
        while (parentDir !== targetRoot) {
          try {
            const entries = readdirSync(parentDir)
            if (entries.length === 0) {
              rmSync(parentDir, { recursive: true })
              parentDir = dirname(parentDir)
            } else {
              break
            }
          } catch {
            break
          }
        }
      }
    }

    // Remove from installed.json
    delete installed[agentName]
    writeInstalledManifest(targetRoot, installed)

    return { removed: removedPaths.length > 0, paths: removedPaths }
  }

  async listInstalled(workspacePath?: string): Promise<InstalledAgent[]> {
    const targetRoot = workspacePath ?? CLAUDE_HOME
    const installed = readInstalledManifest(targetRoot)
    return Object.entries(installed).map(([name, entry]) => ({
      name,
      source: entry.source,
      workspace: targetRoot,
    }))
  }

  resolveInstallPath(_localName: string, global?: boolean): string {
    if (global) return CLAUDE_HOME
    return join(process.cwd(), ".claude")
  }
}

export const claudeAdapter = new ClaudeAdapter()
export { HARDCODED_EXCLUDES as CLAUDE_HARDCODED_EXCLUDES }
