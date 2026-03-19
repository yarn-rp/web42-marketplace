import type { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Web42 — accounts, agents, the CLI, publishing, payments, and more.",
}

export default function FaqLayout({ children }: { children: ReactNode }) {
  return children
}
