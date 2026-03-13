import type { Profile } from "./profile"

export type AgentVisibility = "public" | "private" | "unlisted"

export type AgentLicense =
  | "MIT"
  | "Apache-2.0"
  | "GPL-3.0"
  | "BSD-3-Clause"
  | "Proprietary"
  | "Custom"

export type AgentResourceType = "video" | "image" | "document"

export interface AgentResource {
  id: string
  agent_id: string
  title: string
  description: string | null
  type: AgentResourceType
  url: string
  thumbnail_url: string | null
  sort_order: number
  created_at: string
}

export interface Agent {
  id: string
  slug: string
  name: string
  description: string
  readme: string | null
  cover_image_url: string | null
  demo_video_url: string | null
  profile_image_url: string | null
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
  license: AgentLicense | null
  price_cents: number
  currency: string
  stars_count: number
  remixes_count: number
  installs_count: number
  approved: boolean
  featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  owner?: Profile
  categories?: Category[]
  tags?: Tag[]
  resources?: AgentResource[]
  has_starred?: boolean
  has_access?: boolean
}

export interface AgentAccess {
  user_id: string
  agent_id: string
  price_cents_at_acquisition: number
  created_at: string
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
  content: string | null
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
  format?: string
  platform?: string
  name: string
  description: string
  version: string
  author: string
  skills?: SkillEntry[]
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

export interface SkillEntry {
  name: string
  description: string
}

export interface ConfigVariable {
  key: string
  label: string
  description?: string
  required: boolean
  default?: string
}

export type OrderStatus = "pending" | "completed" | "refunded" | "failed"
export type PaymentMethod = "stripe" | "wallet"
export type RefundStatus = "pending" | "succeeded" | "failed"

export interface Order {
  id: string
  buyer_id: string
  agent_id: string
  seller_id: string
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  amount_cents: number
  platform_fee_cents: number
  seller_amount_cents: number
  currency: string
  payment_method: PaymentMethod
  status: OrderStatus
  refund_eligible_until: string | null
  created_at: string
  updated_at: string
  agent?: Agent
  buyer?: import("./profile").Profile
  seller?: import("./profile").Profile
}

export interface Refund {
  id: string
  order_id: string
  stripe_refund_id: string | null
  amount_cents: number
  reason: string | null
  refund_method: PaymentMethod
  status: RefundStatus
  created_at: string
  order?: Order
}
