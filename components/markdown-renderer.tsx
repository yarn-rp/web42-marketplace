"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none sm:prose-base",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
        "prose-p:leading-7",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-code:font-mono prose-code:rounded-md prose-code:border prose-code:border-border prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:font-normal",
        "prose-pre:rounded-lg prose-pre:border prose-pre:border-border prose-pre:bg-muted/50",
        "prose-pre:font-mono prose-pre:text-[13px]",
        "prose-img:rounded-lg",
        "prose-blockquote:border-l-primary/30 prose-blockquote:text-muted-foreground",
        "prose-hr:border-border",
        "prose-strong:font-semibold",
        "prose-table:text-sm",
        "prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2",
        "prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2",
        "prose-li:marker:text-muted-foreground",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
