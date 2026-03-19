import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Web42 — The AI Agent Marketplace",
    short_name: "Web42",
    description:
      "Install expert-built AI agents in seconds or publish your own and earn.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    icons: [
      {
        src: "/assets/logo/web42-mark-black.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/logo/web42-mark-black.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
