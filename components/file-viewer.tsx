"use client"

import { FileIcon } from "lucide-react"

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
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 py-3 px-4">
        <FileIcon className="size-4 text-muted-foreground" />
        <CardTitle className="font-mono text-sm font-medium">{file.path}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {file.content ? (
          <ScrollArea className="max-h-[500px]">
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
              <code>{file.content}</code>
            </pre>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No content available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
