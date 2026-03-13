"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  indent?: boolean
}

const docsNavItems: NavItem[] = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/quickstart", label: "Quick Start" },
  { href: "/docs/publishing", label: "Publishing" },
  { href: "/docs/cli", label: "CLI Reference" },
  { href: "/docs/monetization", label: "Monetization" },
  { href: "/docs/platforms", label: "Platforms" },
  { href: "/docs/platforms/openclaw", label: "OpenClaw", indent: true },
  { href: "/docs/faq", label: "FAQ" },
]

function isNavItemActive(pathname: string, item: NavItem) {
  if (item.href === "/docs") return pathname === "/docs"
  if (item.href === "/docs/platforms")
    return pathname === "/docs/platforms"
  return pathname === item.href || pathname.startsWith(item.href + "/")
}

export function DocsSidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-border pr-6 md:block">
        <nav className="flex flex-col gap-0.5 py-4">
          {docsNavItems.map((item) => {
            const isActive = isNavItemActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  item.indent && "pl-7",
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
            const isActive = isNavItemActive(pathname, item)
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
