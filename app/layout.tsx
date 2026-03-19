import "./globals.css"
import { ReactNode } from "react"
import { Plus_Jakarta_Sans, JetBrains_Mono, Silkscreen } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TopNav } from "@/components/top-nav"
import { SiteFooter } from "@/components/site-footer"

import { Analytics } from "@vercel/analytics/react"
import { ThemeProvider } from "./providers"
import { getCurrentProfile } from "./actions/profile"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel",
})

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "http://localhost:3000"

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Web42 — The AI Agent Marketplace",
    template: "%s | Web42",
  },
  description:
    "Install expert-built AI agents in seconds or publish your own and earn. Platform-native agents for OpenClaw and more.",
  keywords:
    "AI Agents, Agent Marketplace, CLI, Web42, OpenClaw, Install Agents, Publish Agents",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Web42 — The AI Agent Marketplace",
    description:
      "Install expert-built AI agents in seconds or publish your own and earn. Platform-native agents for OpenClaw and more.",
    type: "website",
    siteName: "Web42",
    url: defaultUrl,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Web42 — The AI Agent Marketplace",
    description:
      "Install expert-built AI agents in seconds or publish your own and earn. Platform-native agents for OpenClaw and more.",
  },
  alternates: {
    canonical: defaultUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile()

  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable} ${silkscreen.variable} font-sans`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Web42",
              url: defaultUrl,
              description:
                "Install expert-built AI agents in seconds or publish your own and earn.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${defaultUrl}/explore?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <TopNav profile={profile} />
            <main className="bg-background text-foreground min-h-screen w-full">
              {children}
            </main>
            <SiteFooter />
          </TooltipProvider>
          <Toaster richColors />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
