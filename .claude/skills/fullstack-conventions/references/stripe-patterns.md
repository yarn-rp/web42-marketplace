# Stripe Patterns

## Webhook Handler
```typescript
export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  switch (event.type) {
    case "checkout.session.completed":
      // Grant access
      break
    case "customer.subscription.deleted":
      // Revoke access
      break
  }

  return new Response("ok")
}
```

## Price Display
```typescript
// Always store as cents, display as dollars
const displayPrice = (cents: number) =>
  `$${(cents / 100).toFixed(2)}`

// In components
<span>{agent.price_cents === 0 ? "Free" : displayPrice(agent.price_cents)}</span>
```
