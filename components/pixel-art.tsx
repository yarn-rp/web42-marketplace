"use client"

import { cn } from "@/lib/utils"

interface PixelArtProps {
  className?: string
}

export function PixelRobot({ className }: PixelArtProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-12", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <rect x="3" y="1" width="2" height="2" />
      <rect x="11" y="1" width="2" height="2" />
      <rect x="2" y="3" width="12" height="2" />
      <rect x="1" y="5" width="14" height="2" />
      <rect x="1" y="7" width="2" height="2" />
      <rect x="5" y="7" width="6" height="2" />
      <rect x="13" y="7" width="2" height="2" />
      <rect x="4" y="7" width="2" height="2" opacity="0.3" />
      <rect x="10" y="7" width="2" height="2" opacity="0.3" />
      <rect x="2" y="9" width="12" height="2" />
      <rect x="3" y="11" width="4" height="2" />
      <rect x="9" y="11" width="4" height="2" />
      <rect x="3" y="13" width="2" height="2" />
      <rect x="11" y="13" width="2" height="2" />
    </svg>
  )
}

export function PixelTerminal({ className }: PixelArtProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-12", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <rect x="0" y="1" width="16" height="2" />
      <rect x="0" y="1" width="2" height="14" />
      <rect x="14" y="1" width="2" height="14" />
      <rect x="0" y="13" width="16" height="2" />
      <rect x="3" y="6" width="2" height="2" />
      <rect x="5" y="8" width="2" height="2" />
      <rect x="8" y="10" width="4" height="2" opacity="0.4" />
    </svg>
  )
}

export function PixelCursor({ className }: PixelArtProps) {
  return (
    <svg
      viewBox="0 0 8 16"
      className={cn("size-8", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <rect x="1" y="0" width="2" height="16" />
      <rect x="0" y="0" width="8" height="2" />
      <rect x="0" y="14" width="8" height="2" />
    </svg>
  )
}

export function PixelScaffold({ className }: PixelArtProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-12", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <rect x="2" y="0" width="12" height="2" />
      <rect x="2" y="0" width="2" height="16" />
      <rect x="6" y="4" width="8" height="2" />
      <rect x="6" y="4" width="2" height="12" />
      <rect x="10" y="8" width="6" height="2" />
      <rect x="10" y="8" width="2" height="8" />
      <rect x="2" y="14" width="14" height="2" />
    </svg>
  )
}

export function PixelBox({ className }: PixelArtProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-12", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <rect x="1" y="2" width="14" height="2" />
      <rect x="1" y="2" width="2" height="12" />
      <rect x="13" y="2" width="2" height="12" />
      <rect x="1" y="12" width="14" height="2" />
      <rect x="4" y="6" width="8" height="2" opacity="0.4" />
      <rect x="4" y="9" width="5" height="2" opacity="0.4" />
    </svg>
  )
}

export function PixelUpload({ className }: PixelArtProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-12", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <rect x="7" y="1" width="2" height="10" />
      <rect x="5" y="3" width="2" height="2" />
      <rect x="9" y="3" width="2" height="2" />
      <rect x="3" y="5" width="2" height="2" />
      <rect x="11" y="5" width="2" height="2" />
      <rect x="1" y="12" width="14" height="2" />
      <rect x="1" y="10" width="2" height="4" />
      <rect x="13" y="10" width="2" height="4" />
    </svg>
  )
}

export function PixelBrackets({ className }: PixelArtProps) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={cn("size-10", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <rect x="0" y="0" width="6" height="2" />
      <rect x="0" y="0" width="2" height="16" />
      <rect x="0" y="14" width="6" height="2" />
      <rect x="18" y="0" width="6" height="2" />
      <rect x="22" y="0" width="2" height="16" />
      <rect x="18" y="14" width="6" height="2" />
      <rect x="9" y="7" width="2" height="2" opacity="0.5" />
      <rect x="13" y="7" width="2" height="2" opacity="0.5" />
    </svg>
  )
}
