"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/db/supabase/client"
import {
  BoxIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogIn,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PanelLeftIcon,
  SettingsIcon,
  SunIcon,
  TagIcon,
} from "lucide-react"

import { useTheme } from "next-themes"

import { cn, truncateString } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function NavSidebar({
  tags,
}: {
  tags?: string[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isSheetOpen, setSheetOpen] = useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  const handleLogout = async () => {
    const db = await createClient()
    const { error } = await db.auth.signOut()
    if (error) {
      console.error("Error logging out:", error.message)
    } else {
      router.push("/login")
    }
  }

  const handleLinkClick = () => {
    setSheetOpen(false)
  }

  return (
    <>
      <aside
        className={cn(
          "w-42",
          "fixed inset-y-0 left-0 z-10 hidden sm:flex flex-col bg-[#FAFAFA] dark:bg-background"
        )}
      >
        <nav className="flex flex-col items-center gap-4 px-2 py-5">
          <AgentNav
            tags={tags}
            searchParams={searchParams}
          />
        </nav>

        <div className="pl-3 flex flex-col justify-center gap-4 items-start pb-8">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                <AvatarFallback className="bg-gradient-to-r from-emerald-300 to-emerald-400" />
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-gradient-to-t from-primary/70 to-primary/80 rounded-lg"
            >
              <div className="p-[1px] bg-background rounded-md">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-primary" />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <SunIcon className="mr-2 size-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
                    <MoonIcon className="absolute mr-2 size-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                        <SunIcon className="mr-2 size-4" />
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <MoonIcon className="mr-2 size-4" />
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                        <MonitorIcon className="mr-2 size-4" />
                        System
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator className="bg-primary" />
                <DropdownMenuItem>
                  <Button className="w-full" onClick={handleLogout}>
                    <LogOutIcon className="mr-1 size-4" /> Logout
                  </Button>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex flex-col gap-4 pb-2 px-2">
        <header
          className={cn(
            "sticky top-0 z-30 flex h-14 mx-1 md:mx-0 rounded-b-lg items-center gap-4 bg-background dark:bg-terminal-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6",
            "shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)]",
            "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]"
          )}
        >
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:hidden bg-accent">
                <PanelLeftIcon />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <div className="ml-auto mt-1 md:hidden">
              <LogoAnimationLink />
            </div>
            <SheetContent
              side="left"
              className="sm:max-w-[15rem] py-4 pl-1 border-r border-primary/10"
            >
              <nav className="flex flex-col items-start gap-4 px-2 py-5">
                <AgentNav
                  tags={tags}
                  handleLinkClick={handleLinkClick}
                  searchParams={searchParams}
                >
                  <div className="my-4 space-y-3">
                    <Link
                      href="/"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      prefetch={false}
                      onClick={handleLinkClick}
                    >
                      <HomeIcon className="h-5 w-5" />
                      Home
                    </Link>
                    <Link
                      href="/explore"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      prefetch={false}
                      onClick={handleLinkClick}
                    >
                      <BoxIcon className="h-5 w-5" />
                      Explore
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      prefetch={false}
                      onClick={handleLinkClick}
                    >
                      <LayoutDashboardIcon className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      prefetch={false}
                      onClick={handleLinkClick}
                    >
                      <SettingsIcon className="h-5 w-5" />
                      Settings
                    </Link>
                    <Link
                      href="/login"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      prefetch={false}
                      onClick={handleLinkClick}
                    >
                      <LogIn className="h-5 w-5" />
                      Login
                    </Link>
                  </div>
                </AgentNav>
              </nav>
              <div className="flex flex-col items-start pl-4">
                <nav className="mb-6 flex gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-r from-emerald-300 to-emerald-400" />
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-gradient-to-t from-primary/70 to-primary/80 rounded-lg"
                    >
                      <div className="p-[1px] bg-background rounded-md">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-primary" />
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard">Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <SunIcon className="mr-2 size-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
                            <MoonIcon className="absolute mr-2 size-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
                            Theme
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => setTheme("light")}>
                                <SunIcon className="mr-2 size-4" />
                                Light
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTheme("dark")}>
                                <MoonIcon className="mr-2 size-4" />
                                Dark
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTheme("system")}>
                                <MonitorIcon className="mr-2 size-4" />
                                System
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator className="bg-primary" />
                        <DropdownMenuItem>
                          <Button className="w-full" onClick={handleLogout}>
                            <LogOutIcon className="mr-1 size-4" /> Logout
                          </Button>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </header>
      </div>
    </>
  )
}

type AgentNavProps = {
  tags?: string[]
  handleLinkClick?: () => void
  searchParams: URLSearchParams
  children?: ReactNode
}

function AgentNav({
  tags,
  searchParams,
  handleLinkClick,
  children,
}: AgentNavProps) {
  return (
    <div>
      <LogoAnimationLink />
      {children}
      <ScrollArea className="h-[calc(100vh-320px)] md:h-[calc(100vh-200px)] flex flex-col gap-4 pl-2">
        {tags && tags.length > 0 && (
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <TagIcon className="size-5 stroke-pink-400" />
            <p className="text-sm md:hidden">Tags</p>
          </div>
        )}
        <ul className="mt-2 md:w-36 flex flex-col gap-2 items-start justify-center py-2">
          {tags?.map((tag, index) => (
            <li key={`tag-${index}-${tag}`}>
              <Link
                href={`/explore?tag=${tag}`}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-start space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-md px-2 py-0.5",
                  "shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)]",
                  "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
                  "dark:hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.5)]",
                  searchParams.get("tag") === tag
                    ? "bg-pink-400 text-black dark:text-black"
                    : ""
                )}
                prefetch={false}
              >
                <span className="px-1 truncate">
                  {truncateString(tag, 14)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}

export function LogoAnimationLink() {
  return (
    <Button
      className="relative w-full h-9 px-3 rounded-md bg-black"
      variant="outline"
      asChild
    >
      <Link href="/" className="flex items-center justify-center">
        <span className="text-sm font-bold text-white tracking-tight">
          web42
        </span>
      </Link>
    </Button>
  )
}
