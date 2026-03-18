"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/db/supabase/client"
import {
  BookOpenIcon,
  LogIn,
  LogOutIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  StoreIcon,
  SunIcon,
  TerminalIcon,
  UserIcon,
} from "lucide-react"

import { useTheme } from "next-themes"

import type { Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { MarketplaceNavItem } from "@/components/marketplace-nav"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const baseNavLinks = [
  { href: "/cli", label: "CLI", icon: TerminalIcon },
  { href: "/docs", label: "Docs", icon: BookOpenIcon },
]

export function TopNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [navValue, setNavValue] = useState("")
  const { setTheme } = useTheme()

  const handleLogout = async () => {
    const db = createClient()
    await db.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Logo */}
        <div className="relative z-10 flex items-center">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <Image
              src="/assets/logo/web42_logo_white.png"
              alt="web42"
              width={80}
              height={21}
              className="hidden dark:block"
              priority
            />
            <Image
              src="/assets/logo/web42_logo_black.png"
              alt="web42"
              width={80}
              height={21}
              className="block dark:hidden"
              priority
            />
          </Link>
        </div>

        {/* Center: Nav (absolutely positioned for true centering) */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center sm:flex">
          <NavigationMenu
            className="pointer-events-auto"
            value={navValue}
            onValueChange={setNavValue}
          >
            <NavigationMenuList>
              <MarketplaceNavItem
                profile={profile}
                pathname={pathname}
                navValue={navValue}
                onNavValueChange={setNavValue}
              />
              {baseNavLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <Link href={link.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "text-sm",
                        pathname === link.href ||
                          pathname.startsWith(link.href + "/")
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right: CTA + Profile */}
        <div className="flex items-center gap-2">
          <Button size="sm" asChild className="hidden font-mono sm:inline-flex">
            <Link href="/cli">
              <TerminalIcon className="mr-2 size-3.5" />
              Get the CLI
            </Link>
          </Button>

          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative size-8 rounded-full"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {profile.username?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">
                    {profile.full_name ?? profile.username}
                  </p>
                  {profile.username && (
                    <p className="text-xs text-muted-foreground">
                      @{profile.username}
                    </p>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${profile.username}`}>
                    <UserIcon className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${profile.username}?tab=marketplace`}>
                    <StoreIcon className="mr-2 size-4" />
                    Marketplace
                  </Link>
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOutIcon className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">
                <LogIn className="mr-2 size-4" />
                Login
              </Link>
            </Button>
          )}

          {/* Mobile hamburger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <MenuIcon className="size-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-6">
              <nav className="mt-8 flex flex-col gap-2">
                <Button size="sm" asChild className="mb-2 font-mono">
                  <Link href="/cli" onClick={() => setSheetOpen(false)}>
                    <TerminalIcon className="mr-2 size-3.5" />
                    Get the CLI
                  </Link>
                </Button>

                <Link
                  href="/explore"
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === "/explore" || pathname.startsWith("/explore/")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <StoreIcon className="size-4" />
                  Marketplace
                </Link>
                {baseNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      pathname === link.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <link.icon className="size-4" />
                    {link.label}
                  </Link>
                ))}
                {!profile && (
                  <Link
                    href="/login"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <LogIn className="size-4" />
                    Login
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
