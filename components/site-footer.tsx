import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

const productLinks = [
  { href: "/explore", label: "Marketplace" },
  { href: "/cli", label: "CLI" },
  { href: "/docs", label: "Docs" },
]

const resourceLinks = [
  { href: "/docs/publishing", label: "Publishing Guide" },
  { href: "/docs/monetization", label: "Monetization" },
  { href: "/docs/faq", label: "FAQ" },
]

const legalLinks = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
]

function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/assets/logo/web42_logo_white.png"
                alt="Web42"
                width={80}
                height={21}
                className="hidden dark:block"
              />
              <Image
                src="/assets/logo/web42_logo_black.png"
                alt="Web42"
                width={80}
                height={21}
                className="block dark:hidden"
              />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              The AI Agent Marketplace
            </p>
          </div>

          <FooterLinkGroup title="Product" links={productLinks} />
          <FooterLinkGroup title="Resources" links={resourceLinks} />
          <FooterLinkGroup title="Legal" links={legalLinks} />
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Web42. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Payments by</span>
            <svg
              viewBox="0 0 60 25"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-auto fill-muted-foreground"
              aria-label="Stripe"
            >
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a13.77 13.77 0 0 1-4.56.75c-4.14 0-6.6-2.1-6.6-6.64 0-3.72 2.1-6.64 5.97-6.64 3.23 0 5.96 2.1 5.96 6.1 0 .52-.04 1.15-.08 1.56l.12-.05ZM55.56 11.2c0-1.47-.7-2.58-2.17-2.58-1.35 0-2.3 1.04-2.47 2.58h4.64ZM40.95 20.2c-1.85 0-3.23-.6-4.17-1.4l-.04 6.26-3.9.83V7.06h3.45l.15 1.27c1.01-1.04 2.44-1.64 4.04-1.64 3.53 0 5.78 3.1 5.78 6.68 0 4.18-2.57 6.82-5.31 6.82Zm-.86-12.07c-1.04 0-1.93.45-2.55 1.2l.04 6.49c.56.67 1.4 1.12 2.47 1.12 1.85 0 3.09-1.93 3.09-4.44 0-2.4-1.2-4.37-3.05-4.37ZM28.25 5.57c-1.27 0-2.28-.97-2.28-2.21 0-1.24 1.01-2.24 2.28-2.24 1.27 0 2.28.97 2.28 2.24 0 1.24-1.01 2.21-2.28 2.21Zm-1.93 14.4V7.06h3.9v12.91h-3.9ZM23.28 7.06l.19 1.56a5.1 5.1 0 0 1 3.68-1.86v3.64c-.45-.07-.86-.11-1.35-.11-1.16 0-2.17.52-2.7 1.38v8.3h-3.87V7.06h4.05ZM12.73 20.2c-2.1 0-3.64-.56-4.95-1.42l.52-3.16c1.35.93 3.05 1.49 4.28 1.49 1.01 0 1.56-.37 1.56-.97 0-1.72-6.38-1.09-6.38-5.94 0-2.92 2.25-4.54 5.37-4.54 1.72 0 3.16.41 4.28 1.05l-.52 3.01c-.97-.67-2.47-1.12-3.68-1.12-.93 0-1.49.34-1.49.93 0 1.6 6.42.93 6.42 5.83 0 2.92-2.21 4.84-5.41 4.84ZM3.42 11.42c0-.97.82-1.38 2.1-1.38 1.35 0 3.05.41 4.4 1.16V7.62A12.43 12.43 0 0 0 5.52 6.7C2.21 6.7 0 8.42 0 11.57c0 4.92 6.72 4.14 6.72 6.26 0 1.16-.97 1.53-2.36 1.53-2.02 0-3.87-.82-5.08-1.64L0 21.2A13.15 13.15 0 0 0 5.64 22.5c3.42 0 5.78-1.64 5.78-4.87 0-5.3-6.75-4.37-6.75-6.37l-.04.15h.79Z" />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  )
}
