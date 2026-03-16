import { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import { SELLER_AGREEMENT } from "@/lib/legal-content"

export const metadata: Metadata = {
  title: "Seller Agreement — Web42",
  description:
    "Seller Agreement for the Web42 AI Agent Marketplace. Covers publishing requirements, licensing, revenue model, refunds, tax responsibility, and content standards for creators.",
}

export default function SellerAgreementPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown>{SELLER_AGREEMENT}</ReactMarkdown>
    </article>
  )
}
