"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BotIcon,
  PuzzleIcon,
  SparklesIcon,
  StoreIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { requestMarketplaceAccess, type MarketplaceType } from "@/app/actions/marketplace"

const marketplaceItems: Array<
  | {
      id: "agents"
      label: string
      description: string
      icon: typeof BotIcon
      href: string
      available: true
    }
  | {
      id: MarketplaceType
      label: string
      description: string
      icon: typeof SparklesIcon
      available: false
    }
> = [
  {
    id: "agents",
    label: "Agents",
    description: "Install expert-built AI agents",
    icon: BotIcon,
    href: "/explore",
    available: true,
  },
  {
    id: "skills",
    label: "Skills",
    description: "Extend agents with reusable skills",
    icon: SparklesIcon,
    available: false,
  },
  {
    id: "plugins",
    label: "Plugins",
    description: "Integrate tools and APIs",
    icon: PuzzleIcon,
    available: false,
  },
]

export function MarketplaceNavItem({
  profile,
  pathname,
}: {
  profile: Profile | null
  pathname: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<MarketplaceType | null>(null)
  const [requested, setRequested] = useState<Set<string>>(new Set())

  const handleRequestAccess = async (type: MarketplaceType) => {
    if (!profile) {
      toast.error("Please log in to request access")
      router.push("/login")
      return
    }

    setLoading(type)
    const result = await requestMarketplaceAccess(type)
    setLoading(null)

    if (result.success) {
      setRequested((prev) => new Set(prev).add(type))
      toast.success("You're on the list! We'll notify you when it's ready.")
    } else {
      toast.error(result.error ?? "Something went wrong")
    }
  }

  const isExploreActive =
    pathname === "/explore" || pathname.startsWith("/explore/")

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn(
          "text-sm",
          isExploreActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground"
        )}
      >
        Marketplace
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="w-[340px] p-2">
          {marketplaceItems.map((item) => {
            if (item.available) {
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            }

            const isRequested = requested.has(item.id)

            return (
              <li key={item.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <item.icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-tight">
                      {item.label}
                    </p>
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] font-medium"
                    >
                      Soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div className="shrink-0">
                  {isRequested ? (
                    <span className="text-xs text-muted-foreground">Joined</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRequestAccess(item.id)}
                      disabled={loading === item.id}
                    >
                      {loading === item.id ? "…" : "Get Notified"}
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}
