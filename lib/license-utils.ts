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

export function getAllowedLicenses(priceCents: number): AgentLicense[] {
  return priceCents === 0 ? FREE_LICENSES : PAID_LICENSES
}
