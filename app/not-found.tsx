import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PixelRobot } from "@/components/pixel-art"
import { HomeIcon, StoreIcon } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-muted-foreground/30">
        <PixelRobot className="size-24" />
      </div>

      <p className="mb-2 font-pixel text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Error 404
      </p>

      <h1 className="mb-3 text-3xl font-bold tracking-tight">
        Page not found
      </h1>

      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/">
            <HomeIcon className="mr-2 size-4" />
            Home
          </Link>
        </Button>
        <Button asChild>
          <Link href="/explore">
            <StoreIcon className="mr-2 size-4" />
            Marketplace
          </Link>
        </Button>
      </div>
    </div>
  )
}
