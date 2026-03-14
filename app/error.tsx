"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCwIcon } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-2 font-pixel text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Something went wrong
      </p>

      <h1 className="mb-3 text-3xl font-bold tracking-tight">
        Unexpected error
      </h1>

      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        An error occurred while loading this page. Please try again.
      </p>

      <Button onClick={reset}>
        <RefreshCwIcon className="mr-2 size-4" />
        Try again
      </Button>
    </div>
  )
}
