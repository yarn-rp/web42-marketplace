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
