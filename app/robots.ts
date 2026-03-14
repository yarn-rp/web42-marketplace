import { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://web42.ai"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login", "/auth/", "/dashboard/", "/settings"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
