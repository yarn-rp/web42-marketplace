import { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://web42.ai"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/cli`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/docs`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/docs/quickstart`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/docs/publishing`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/docs/monetization`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/docs/cli`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/docs/platforms`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/docs/faq`, changeFrequency: "monthly", priority: 0.4 },
  ]

  let dynamicRoutes: MetadataRoute.Sitemap = []

  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: agents } = await db
      .from("agents")
      .select("slug, updated_at, owner:users!owner_id(username)")
      .eq("visibility", "public")
      .not("published_at", "is", null)

    if (agents) {
      for (const agent of agents) {
        const owner = (agent.owner as unknown as { username: string }[])?.[0]
        if (!owner?.username) continue
        dynamicRoutes.push({
          url: `${BASE_URL}/${owner.username}/${agent.slug}`,
          lastModified: agent.updated_at ? new Date(agent.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        })
      }
    }

    const { data: users } = await db
      .from("users")
      .select("username, updated_at")
      .not("username", "is", null)

    if (users) {
      for (const user of users) {
        if (!user.username) continue
        dynamicRoutes.push({
          url: `${BASE_URL}/${user.username}`,
          lastModified: user.updated_at ? new Date(user.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        })
      }
    }
  } catch {
    // If DB is unavailable, return only static routes
  }

  return [...staticRoutes, ...dynamicRoutes]
}
