import { ReactNode } from "react"

import { DocsSidebar } from "@/components/docs-sidebar"

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:gap-8">
      <DocsSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
