"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { AgentResource } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface ResourceGalleryProps {
  resources: AgentResource[]
  open: boolean
  onOpenChange: (open: boolean) => void
  initialIndex?: number
}

export function ResourceGallery({
  resources,
  open,
  onOpenChange,
  initialIndex = 0,
}: ResourceGalleryProps) {
  const [current, setCurrent] = useState(initialIndex)

  useEffect(() => {
    if (open) setCurrent(initialIndex)
  }, [open, initialIndex])

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % resources.length)
  }, [resources.length])

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + resources.length) % resources.length)
  }, [resources.length])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext()
      else if (e.key === "ArrowLeft") goPrev()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, goNext, goPrev])

  if (resources.length === 0) return null

  const resource = resources[current]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Resource gallery</DialogTitle>

        <div className="relative flex items-center justify-center bg-black">
          {resource.type === "video" ? (
            <video
              key={resource.id}
              src={resource.url}
              controls
              autoPlay
              className="max-h-[70vh] w-full object-contain"
            />
          ) : (
            <img
              key={resource.id}
              src={resource.url}
              alt={resource.title}
              className="max-h-[70vh] w-full object-contain"
            />
          )}

          {resources.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={goPrev}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={goNext}
              >
                <ChevronRight className="size-5" />
              </Button>
            </>
          )}
        </div>

        {resources.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto border-t bg-background p-3">
            {resources.map((res, index) => (
              <button
                key={res.id}
                type="button"
                onClick={() => setCurrent(index)}
                className={cn(
                  "relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition",
                  index === current
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                {res.type === "video" ? (
                  <video
                    src={res.url}
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={res.url}
                    alt={res.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
