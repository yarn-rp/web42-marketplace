import type { AgentLicense } from "@/lib/types"

export const FREE_LICENSES: AgentLicense[] = [
  "MIT",
  "Apache-2.0",
  "GPL-3.0",
  "BSD-3-Clause",
]

export const PAID_LICENSES: AgentLicense[] = ["Proprietary", "Custom"]

export function isFreeLicense(license: AgentLicense): boolean {
  return (FREE_LICENSES as string[]).includes(license)
}

export function isPaidLicense(license: AgentLicense): boolean {
  return (PAID_LICENSES as string[]).includes(license)
}

export function getAllowedLicenses(_priceCents: number): AgentLicense[] {
  return [...FREE_LICENSES, ...PAID_LICENSES]
}

export function getLicensePriceWarning(
  license: AgentLicense,
  priceCents: number
): string | null {
  if (priceCents === 0 && isPaidLicense(license))
    return "Commercial licenses are typically used with paid pricing. You will need to resolve this before publishing."
  if (priceCents > 0 && isFreeLicense(license))
    return "Open-source licenses are typically used with free pricing. You will need to resolve this before publishing."
  return null
}
