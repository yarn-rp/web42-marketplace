import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Web42 — The AI Agent Marketplace"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="#ffffff" />
            <text
              x="16"
              y="22"
              textAnchor="middle"
              fill="#0A0A0A"
              fontFamily="monospace"
              fontSize="11"
              fontWeight="bold"
            >
              42
            </text>
          </svg>
          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            Web42
          </span>
        </div>

        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            marginBottom: "16px",
          }}
        >
          The AI Agent Marketplace
        </div>

        <div
          style={{
            fontSize: 20,
            color: "#71717a",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Install expert-built agents in seconds or publish your own and earn.
        </div>
      </div>
    ),
    { ...size }
  )
}
