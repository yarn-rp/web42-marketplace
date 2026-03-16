import { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import { AI_DISCLAIMER } from "@/lib/legal-content"

export const metadata: Metadata = {
  title: "AI Agent Disclaimer — Web42",
  description:
    "AI Agent Disclaimer for the Web42 AI Agent Marketplace. Covers third-party content, no warranty, user responsibility, and limitation of liability for AI agent behavior.",
}

export default function DisclaimerPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown>{AI_DISCLAIMER}</ReactMarkdown>
    </article>
  )
}
