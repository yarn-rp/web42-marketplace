export const PLATFORM_FEE_PERCENT = 10
export const MIN_PRICE_CENTS = 500
export const REFUND_WINDOW_DAYS = 7

export function calculateFees(amountCents: number) {
  const platformFeeCents = Math.floor(amountCents * (PLATFORM_FEE_PERCENT / 100))
  const sellerAmountCents = amountCents - platformFeeCents
  return { platformFeeCents, sellerAmountCents }
}

export function isRefundEligible(orderCreatedAt: string): boolean {
  const created = new Date(orderCreatedAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= REFUND_WINDOW_DAYS
}

export function getRefundDeadline(orderCreatedAt: string): Date {
  const created = new Date(orderCreatedAt)
  return new Date(created.getTime() + REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000)
}
