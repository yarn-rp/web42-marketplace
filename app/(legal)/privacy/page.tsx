import { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import { PRIVACY_POLICY } from "@/lib/legal-content"

export const metadata: Metadata = {
  title: "Privacy Policy — Web42",
  description:
    "Privacy Policy for the Web42 AI Agent Marketplace. Covers data collection, third-party services, cookies, and your rights.",
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown>{PRIVACY_POLICY}</ReactMarkdown>
    </article>
  )
}
