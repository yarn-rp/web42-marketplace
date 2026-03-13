import Stripe from "stripe"

export {
  PLATFORM_FEE_PERCENT,
  MIN_PRICE_CENTS,
  REFUND_WINDOW_DAYS,
  calculateFees,
  isRefundEligible,
  getRefundDeadline,
} from "./stripe-utils"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    })
  }
  return _stripe
}

/** @deprecated Use getStripe() instead for lazy initialization */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop]
  },
})
