const STRIPE_API_BASE = "https://api.stripe.com/v1"

function getKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return key
}

function flattenParams(
  params: Record<string, unknown>,
  prefix = ""
): [string, string][] {
  const entries: [string, string][] = []

  for (const [key, value] of Object.entries(params)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key

    if (value === undefined || value === null) continue

    if (typeof value === "object" && !Array.isArray(value)) {
      entries.push(
        ...flattenParams(value as Record<string, unknown>, fullKey)
      )
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object") {
          entries.push(
            ...flattenParams(item as Record<string, unknown>, `${fullKey}[${i}]`)
          )
        } else {
          entries.push([`${fullKey}[${i}]`, String(item)])
        }
      })
    } else {
      entries.push([fullKey, String(value)])
    }
  }

  return entries
}

export async function stripePost<T = Record<string, unknown>>(
  path: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const body = new URLSearchParams(flattenParams(params)).toString()

  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || `Stripe API error ${res.status}`)
  }
  return data as T
}

export async function stripeGet<T = Record<string, unknown>>(
  path: string
): Promise<T> {
  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getKey()}`,
    },
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || `Stripe API error ${res.status}`)
  }
  return data as T
}

export function getSiteUrl(requestHeaders?: Headers): string {
  if (requestHeaders) {
    const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host")
    if (host) {
      const protocol = requestHeaders.get("x-forwarded-proto") || "https"
      return `${protocol}://${host}`
    }
  }

  return process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}
