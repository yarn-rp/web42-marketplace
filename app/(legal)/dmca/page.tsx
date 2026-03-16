import { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import { DMCA_POLICY } from "@/lib/legal-content"

export const metadata: Metadata = {
  title: "DMCA & Intellectual Property Policy — Web42",
  description:
    "DMCA and Intellectual Property Policy for the Web42 AI Agent Marketplace. Covers takedown procedures, counter-notifications, repeat infringer policy, and IP claims.",
}

export default function DmcaPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown>{DMCA_POLICY}</ReactMarkdown>
    </article>
  )
}
