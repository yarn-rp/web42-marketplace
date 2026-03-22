export interface AgentExtension {
  uri: string
  description?: string
  required?: boolean
  params?: Record<string, unknown>
}

export interface AgentSkillCard {
  id: string
  name: string
  description: string
  tags?: string[]
  examples?: string[]
  inputModes?: string[]
  outputModes?: string[]
}

export interface AgentCardJSON {
  name: string
  description: string
  url?: string
  version?: string
  protocolVersion?: string
  documentationUrl?: string
  iconUrl?: string
  provider?: {
    organization?: string
    url?: string
  }
  capabilities?: {
    streaming?: boolean
    pushNotifications?: boolean
    stateTransitionHistory?: boolean
    extensions?: AgentExtension[]
  }
  skills?: AgentSkillCard[]
  defaultInputModes?: string[]
  defaultOutputModes?: string[]
  securitySchemes?: Record<string, unknown>
  security?: Record<string, string[]>[]
}

export interface MarketplaceExtensionParams {
  price_cents?: number
  currency?: string
  license?: string
  visibility?: string
  categories?: string[]
  tags?: string[]
}

const MARKETPLACE_EXT_URI = "https://web42.ai/ext/marketplace/v1"

export function getCardName(card: AgentCardJSON | null | undefined): string {
  return card?.name ?? "Untitled Agent"
}

export function getCardDescription(
  card: AgentCardJSON | null | undefined
): string {
  return card?.description ?? ""
}

export function getMarketplaceExtension(
  card: AgentCardJSON | null | undefined
): MarketplaceExtensionParams | null {
  const ext = card?.capabilities?.extensions?.find(
    (e) => e.uri === MARKETPLACE_EXT_URI
  )
  if (!ext?.params) return null
  return ext.params as MarketplaceExtensionParams
}

export function getCardSkills(
  card: AgentCardJSON | null | undefined
): AgentSkillCard[] {
  return card?.skills ?? []
}

export function getCardVersion(
  card: AgentCardJSON | null | undefined
): string {
  return card?.version ?? "0.0.0"
}

export function getCardProvider(
  card: AgentCardJSON | null | undefined
): string | null {
  return card?.provider?.organization ?? null
}
