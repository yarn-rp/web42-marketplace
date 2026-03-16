import { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import { ACCEPTABLE_USE_POLICY } from "@/lib/legal-content"

export const metadata: Metadata = {
  title: "Acceptable Use Policy — Web42",
  description:
    "Acceptable Use Policy for the Web42 AI Agent Marketplace. Covers prohibited content, anti-piracy rules, marketplace behavior standards, and enforcement actions.",
}

export default function AcceptableUsePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown>{ACCEPTABLE_USE_POLICY}</ReactMarkdown>
    </article>
  )
}
