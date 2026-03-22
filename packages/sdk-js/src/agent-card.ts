/**
 * Helpers for building A2A AgentCards with Web42 Bearer authentication.
 *
 * These utilities stamp the correct `securitySchemes` and `security` fields
 * onto an AgentCard so callers know they must supply a Web42 Bearer token.
 *
 * Deliberately avoids importing from `@a2a-js/sdk` so this package stays
 * framework-agnostic. The returned objects are structurally compatible with
 * the A2A spec and the `AgentCard` type from `@a2a-js/sdk`.
 */

/** The security scheme name used by convention in Web42 agent cards. */
export const WEB42_SECURITY_SCHEME = "Web42Bearer" as const;

interface HttpSecurityScheme {
  type: "http";
  scheme: string;
  bearerFormat?: string;
}

interface SecuritySchemes {
  [key: string]: HttpSecurityScheme;
}

type SecurityRequirement = Record<string, string[]>;

/**
 * Returns the `securitySchemes` + `security` blocks to embed in an AgentCard.
 */
export function buildAgentCardSecurity(): {
  securitySchemes: SecuritySchemes;
  security: SecurityRequirement[];
} {
  return {
    securitySchemes: {
      [WEB42_SECURITY_SCHEME]: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Web42 JWT (RS256)",
      },
    },
    security: [{ [WEB42_SECURITY_SCHEME]: [] }],
  };
}

interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
}

interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
}

export interface BuildAgentCardOptions {
  name: string;
  description: string;
  /** Full URL to the JSON-RPC endpoint, e.g. "http://localhost:3001/a2a/jsonrpc" */
  url: string;
  version?: string;
  skills?: AgentSkill[];
  capabilities?: AgentCapabilities;
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
}

/**
 * Builds an A2A `AgentCard` pre-populated with Web42 Bearer security.
 *
 * The returned object is structurally compatible with `AgentCard` from
 * `@a2a-js/sdk` — assign it directly or spread it.
 *
 * @example
 * import { buildAgentCard } from "@web42/auth";
 *
 * const agentCard = buildAgentCard({
 *   name: "My Agent",
 *   description: "Does cool things",
 *   url: `http://localhost:${PORT}/a2a/jsonrpc`,
 *   skills: [{ id: "cool-skill", name: "Cool Skill", description: "..." }],
 * });
 */
export function buildAgentCard(options: BuildAgentCardOptions): {
  name: string;
  description: string;
  url: string;
  protocolVersion: string;
  version: string;
  capabilities: AgentCapabilities;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  securitySchemes: SecuritySchemes;
  security: SecurityRequirement[];
} {
  const {
    name,
    description,
    url,
    version = "1.0.0",
    skills = [],
    capabilities = { streaming: false, pushNotifications: false },
    defaultInputModes = ["text"],
    defaultOutputModes = ["text"],
  } = options;

  return {
    name,
    description,
    url,
    protocolVersion: "0.3.0",
    version,
    capabilities,
    defaultInputModes,
    defaultOutputModes,
    skills,
    ...buildAgentCardSecurity(),
  };
}
