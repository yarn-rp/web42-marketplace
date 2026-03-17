export interface AgentSnapshot {
  identity: { name: string; slug: string; description: string }
  readme: string
  manifest: Record<string, unknown>
  marketplace: {
    price_cents: number
    currency: string
    license: string | null
    visibility: string
    tags: string[]
  }
  avatar_url: string | null
  resources: Array<{
    title: string
    description: string | null
    type: string
    url: string
    thumbnail_url: string | null
    sort_order: number
  }>
  files: Array<{ path: string; content: string | null; content_hash: string }>
}

export interface SyncStatusResponse {
  hash: string
  updated_at: string
}

export interface SyncPushResponse {
  hash: string
  updated_at: string
}

export interface SyncPullResponse {
  hash: string
  updated_at: string
  snapshot: AgentSnapshot
}

export interface AvatarUploadResponse {
  avatar_url: string | null
  hash: string
  updated_at: string
}

export interface ResourcesUploadResponse {
  resources: Array<Record<string, unknown>>
  hash: string
  updated_at: string
}

export interface SyncState {
  agent_id: string
  last_remote_hash: string
  last_local_hash: string
  synced_at: string
}

export interface MarketplaceConfig {
  price_cents: number
  currency: string
  license: string | null
  visibility: string
  tags: string[]
}

export interface ResourceMeta {
  file: string
  title: string
  description?: string
  type: "video" | "image" | "document"
  sort_order: number
}

export const DEFAULT_MARKETPLACE: MarketplaceConfig = {
  price_cents: 0,
  currency: "usd",
  license: null,
  visibility: "private",
  tags: [],
}
