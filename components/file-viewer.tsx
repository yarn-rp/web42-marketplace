"use client"

import { useEffect, useState } from "react"
import { FileIcon, Loader2Icon } from "lucide-react"

import type { AgentFile } from "@/lib/types"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface FileViewerProps {
  file: AgentFile
}

export function FileViewer({ file }: FileViewerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fileName = file.path.split("/").pop() ?? file.path

  useEffect(() => {
    setLoading(true)
    setContent(null)

    if (file.storage_url) {
      fetch(file.storage_url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch")
          return res.text()
        })
        .then(setContent)
        .catch(() => setContent(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [file.storage_url])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 py-3 px-4">
        <FileIcon className="size-4 text-muted-foreground" />
        <CardTitle className="font-mono text-sm font-medium">{file.path}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : content ? (
          <ScrollArea className="max-h-[500px]">
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
              <code>{content}</code>
            </pre>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Unable to load file content
          </div>
        )}
      </CardContent>
    </Card>
  )
}
