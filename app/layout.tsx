import "./globals.css"
import { ReactNode } from "react"
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TopNav } from "@/components/top-nav"

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

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "http://localhost:3000"

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Web42 Agent Marketplace",
  description:
    "Discover, remix, and install agent packages. Share your exact agent setup so others can have exactly what you have.",
  keywords:
    "AI Agents, Agent Marketplace, CLI, Web42, Agent Packages",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Web42 Agent Marketplace",
    description:
      "Discover, remix, and install agent packages. Share your exact agent setup so others can have exactly what you have.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile()

  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans`}>
      <body>
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
          </TooltipProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
