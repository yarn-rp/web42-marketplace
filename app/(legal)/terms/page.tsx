import { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import { TERMS_OF_SERVICE } from "@/lib/legal-content"

export const metadata: Metadata = {
  title: "Terms of Service — Web42",
  description:
    "Terms of Service for the Web42 AI Agent Marketplace. Covers marketplace transactions, refund policy, publishing guidelines, and platform usage.",
}

export default function TermsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown>{TERMS_OF_SERVICE}</ReactMarkdown>
    </article>
  )
}
