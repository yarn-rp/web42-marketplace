import type { Profile } from "./profile"
import type { AgentCardJSON } from "@/lib/agent-card-utils"

export type AgentVisibility = "public" | "private" | "unlisted"

export type AgentLicense =
  | "MIT"
  | "Apache-2.0"
  | "GPL-3.0"
  | "BSD-3-Clause"
  | "Proprietary"
  | "Custom"

export type AgentResourceType = "video" | "image" | "document"

export interface AgentFile {
  path: string
  content: string | null
}

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
  agent_card: AgentCardJSON
  readme: string | null
  profile_image_url: string | null
  a2a_url: string | null
  owner_id: string
  stars_count: number
  interactions_count: number
  approved: boolean
  featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  gateway_status?: "live" | "offline" | null
  owner?: Profile
  categories?: Category[]
  tags?: Tag[]
  resources?: AgentResource[]
  has_starred?: boolean
  has_access?: boolean
  // Stripe connect fields
  stripe_product_id?: string | null
  stripe_price_id?: string | null
  stripe_connect_account_id?: string | null
}

export interface AgentAccess {
  user_id: string
  agent_id: string
  price_cents_at_acquisition: number
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

