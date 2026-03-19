import { createHash } from "crypto"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs"
import { join, relative } from "path"

import type {
  AgentSnapshot,
  MarketplaceConfig,
  ResourceMeta,
  SyncState,
} from "../types/sync.js"

const AVATAR_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"]

// ---------------------------------------------------------------------------
// Hash functions -- exact mirror of lib/sync/agent-sync.ts
// ---------------------------------------------------------------------------

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex")
}

export function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {}
      for (const k of Object.keys(value).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k]
      }
      return sorted
    }
    return value
  })
}

export function computeHashFromSnapshot(snapshot: AgentSnapshot): string {
  const parts = [
    canonicalJson(snapshot.identity),
    snapshot.readme,
    canonicalJson(snapshot.manifest),
    canonicalJson(snapshot.marketplace),
    snapshot.avatar_url ?? "",
    canonicalJson(
      snapshot.resources
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((r) => ({
          description: r.description,
          sort_order: r.sort_order,
          thumbnail_url: r.thumbnail_url,
          title: r.title,
          type: r.type,
          url: r.url,
        }))
    ),
    snapshot.files
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((f) => f.content_hash)
      .join("|"),
  ]
  return sha256(parts.join("\x00"))
}

// ---------------------------------------------------------------------------
// .web42/sync.json
// ---------------------------------------------------------------------------

export function readSyncState(cwd: string): SyncState | null {
  const p = join(cwd, ".web42", "sync.json")
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as SyncState
  } catch {
    return null
  }
}

export function writeSyncState(cwd: string, state: SyncState): void {
  const dir = join(cwd, ".web42")
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "sync.json"), JSON.stringify(state, null, 2) + "\n")
}

// ---------------------------------------------------------------------------
// .web42/marketplace.json
// ---------------------------------------------------------------------------

const MARKETPLACE_DEFAULTS: MarketplaceConfig = {
  price_cents: 0,
  currency: "usd",
  license: null,
  visibility: "private",
  tags: [],
}

export function readMarketplace(cwd: string): MarketplaceConfig {
  const p = join(cwd, ".web42", "marketplace.json")
  if (!existsSync(p)) return { ...MARKETPLACE_DEFAULTS }
  try {
    const raw = JSON.parse(readFileSync(p, "utf-8"))
    return {
      price_cents: raw.price_cents ?? MARKETPLACE_DEFAULTS.price_cents,
      currency: raw.currency ?? MARKETPLACE_DEFAULTS.currency,
      license: raw.license ?? MARKETPLACE_DEFAULTS.license,
      visibility: raw.visibility ?? MARKETPLACE_DEFAULTS.visibility,
      tags: Array.isArray(raw.tags) ? raw.tags : MARKETPLACE_DEFAULTS.tags,
    }
  } catch {
    return { ...MARKETPLACE_DEFAULTS }
  }
}

export function writeMarketplace(
  cwd: string,
  data: MarketplaceConfig
): void {
  const dir = join(cwd, ".web42")
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, "marketplace.json"),
    JSON.stringify(data, null, 2) + "\n"
  )
}

// ---------------------------------------------------------------------------
// .web42/avatar.*
// ---------------------------------------------------------------------------

export function findLocalAvatar(cwd: string): string | null {
  const dir = join(cwd, ".web42")
  if (!existsSync(dir)) return null
  for (const ext of AVATAR_EXTENSIONS) {
    const p = join(dir, `avatar.${ext}`)
    if (existsSync(p)) return p
  }
  return null
}

export function findAgentAvatar(cwd: string): string | null {
  const avatarSearchPaths = [
    join(cwd, "avatar/avatar.png"),
    join(cwd, "avatars/avatar.png"),
    join(cwd, "avatar.png"),
  ]
  for (const ap of avatarSearchPaths) {
    if (existsSync(ap)) return ap
  }
  return null
}

// ---------------------------------------------------------------------------
// .web42/resources.json + .web42/resources/ + root resources/
// ---------------------------------------------------------------------------

const RESOURCE_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"];
const RESOURCE_VIDEO_EXTENSIONS = ["mp4", "webm"];

export function discoverResources(cwd: string): ResourceMeta[] {
  const resourcesDir = join(cwd, "resources");
  if (!existsSync(resourcesDir)) return [];

  const meta: ResourceMeta[] = [];
  const entries = readdirSync(resourcesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) continue;

    const ext = entry.name.split(".").pop()?.toLowerCase() || "";
    let type: "image" | "video" | "document" | null = null;

    if (RESOURCE_IMAGE_EXTENSIONS.includes(ext)) {
      type = "image";
    } else if (RESOURCE_VIDEO_EXTENSIONS.includes(ext)) {
      type = "video";
    }

    if (!type) {
      throw new Error(
        `Unsupported file type in resources/ folder: ${entry.name}. Only images and videos are allowed.`
      );
    }

    meta.push({
      file: entry.name,
      title: entry.name.split(".").slice(0, -1).join("."),
      type,
      sort_order: meta.length,
    });
  }

  return meta;
}

export function readResourcesMeta(cwd: string): ResourceMeta[] {
  const p = join(cwd, ".web42", "resources.json")
  if (!existsSync(p)) return []
  try {
    const raw = JSON.parse(readFileSync(p, "utf-8"))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function writeResourcesMeta(
  cwd: string,
  meta: ResourceMeta[]
): void {
  const dir = join(cwd, ".web42")
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, "resources.json"),
    JSON.stringify(meta, null, 2) + "\n"
  )
}

// ---------------------------------------------------------------------------
// Read packed files from .web42/dist/
// ---------------------------------------------------------------------------

function readPackedFiles(
  dir: string
): Array<{ path: string; content: string; content_hash: string }> {
  const files: Array<{ path: string; content: string; content_hash: string }> =
    []

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else {
        if (entry.name === "manifest.json" && currentDir === dir) continue
        const stat = statSync(fullPath)
        if (stat.size > 1024 * 1024) continue
        try {
          const content = readFileSync(fullPath, "utf-8")
          const relPath = relative(dir, fullPath)
          files.push({ path: relPath, content, content_hash: sha256(content) })
        } catch {
          // skip binary files
        }
      }
    }
  }

  if (existsSync(dir)) walk(dir)
  return files
}

// ---------------------------------------------------------------------------
// Build a full AgentSnapshot from local workspace
// ---------------------------------------------------------------------------

export function buildLocalSnapshot(cwd: string, overrideDistDir?: string): AgentSnapshot {
  const manifestPath = join(cwd, "manifest.json")
  const manifest: Record<string, unknown> = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf-8"))
    : {}

  const name = (manifest.name as string) ?? ""
  const description = (manifest.description as string) ?? ""
  const slug = name

  const readmePath = join(cwd, "README.md")
  const readme = existsSync(readmePath)
    ? readFileSync(readmePath, "utf-8")
    : ""

  const marketplace = readMarketplace(cwd)

  const avatarPath = findLocalAvatar(cwd)
  const syncState = readSyncState(cwd)

  const distDir = overrideDistDir ?? join(cwd, ".web42", "dist")
  const files = readPackedFiles(distDir)

  return {
    identity: { name, slug, description },
    readme,
    manifest,
    marketplace,
    avatar_url: null,
    resources: [],
    files,
  }
}
