"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const docsNavItems = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/publishing", label: "Publishing Guide" },
  { href: "/docs/cli", label: "CLI Reference" },
  { href: "/docs/monetization", label: "Monetization" },
  { href: "/docs/faq", label: "FAQ" },
]

export function DocsSidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-border pr-6 md:block">
        <nav className="flex flex-col gap-0.5 py-4">
          {docsNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/docs" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="w-full overflow-x-auto pb-2 md:hidden">
        <nav className="flex gap-1">
          {docsNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/docs" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
