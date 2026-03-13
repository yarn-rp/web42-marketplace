import Image from "next/image"

import type { Platform } from "@/lib/platforms"
import { cn } from "@/lib/utils"

interface PlatformLogoProps {
  platform: Platform
  size?: number
  className?: string
}

export function PlatformLogo({ platform, size = 40, className }: PlatformLogoProps) {
  if (platform.logoDark) {
    return (
      <>
        <Image
          src={platform.logo}
          alt={platform.name}
          width={size}
          height={size}
          className={cn("shrink-0 rounded dark:hidden", className)}
        />
        <Image
          src={platform.logoDark}
          alt={platform.name}
          width={size}
          height={size}
          className={cn("hidden shrink-0 rounded dark:block", className)}
        />
      </>
    )
  }

  return (
    <Image
      src={platform.logo}
      alt={platform.name}
      width={size}
      height={size}
      className={cn("shrink-0 rounded", className)}
    />
  )
}
