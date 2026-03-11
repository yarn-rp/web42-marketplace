import type { Profile } from "./profile"

export type AgentVisibility = "public" | "private" | "unlisted"

export interface Agent {
  id: string
  slug: string
  name: string
  description: string
  readme: string | null
  cover_image_url: string | null
  demo_video_url: string | null
  manifest: AgentManifest
  owner_id: string
  remixed_from_id: string | null
  remixed_from?: {
    id: string
    slug: string
    name: string
    owner: { username: string }
  } | null
  visibility: AgentVisibility
  price_cents: number
  currency: string
  stars_count: number
  remixes_count: number
  installs_count: number
  approved: boolean
  featured: boolean
  created_at: string
  updated_at: string
  owner?: Profile
  categories?: Category[]
  tags?: Tag[]
  has_starred?: boolean
}

export interface AgentVersion {
  id: string
  agent_id: string
  version: string
  changelog: string | null
  created_at: string
}

export interface AgentFile {
  id: string
  agent_id: string
  version_id: string | null
  path: string
  content_hash: string
  storage_url: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  icon: string | null
  created_at: string
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

export interface AgentManifest {
  name: string
  description: string
  version: string
  author: string
  channels?: string[]
  skills?: string[]
  plugins?: string[]
  modelPreferences?: {
    primary?: string
    fallback?: string
  }
  tags?: string[]
  coverImage?: string
  demoVideoUrl?: string
  configVariables?: ConfigVariable[]
}

export interface ConfigVariable {
  key: string
  label: string
  description?: string
  required: boolean
  default?: string
}
