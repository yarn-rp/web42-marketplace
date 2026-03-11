"use client"

import { useState } from "react"
import { FileIcon, FolderIcon } from "lucide-react"

import type { AgentFile } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { FileViewer } from "./file-viewer"

interface FileBrowserProps {
  files: AgentFile[]
}

interface TreeEntry {
  name: string
  path: string
  isDirectory: boolean
  file?: AgentFile
}

function buildTree(files: AgentFile[], currentDir: string): TreeEntry[] {
  const prefix = currentDir ? currentDir + "/" : ""
  const entries = new Map<string, TreeEntry>()

  for (const file of files) {
    if (!file.path.startsWith(prefix) && currentDir) continue
    if (file.path === currentDir) continue

    const remaining = currentDir ? file.path.slice(prefix.length) : file.path
    const slashIdx = remaining.indexOf("/")

    if (slashIdx === -1) {
      entries.set(remaining, {
        name: remaining,
        path: file.path,
        isDirectory: false,
        file,
      })
    } else {
      const dirName = remaining.slice(0, slashIdx)
      if (!entries.has(dirName)) {
        entries.set(dirName, {
          name: dirName,
          path: prefix + dirName,
          isDirectory: true,
        })
      }
    }
  }

  const sorted = Array.from(entries.values()).sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.name.localeCompare(b.name)
  })

  return sorted
}

export function FileBrowser({ files }: FileBrowserProps) {
  const [currentDir, setCurrentDir] = useState("")
  const [selectedFile, setSelectedFile] = useState<AgentFile | null>(null)

  const entries = buildTree(files, currentDir)
  const breadcrumbs = currentDir ? currentDir.split("/") : []

  const handleNavigate = (entry: TreeEntry) => {
    if (entry.isDirectory) {
      setCurrentDir(entry.path)
      setSelectedFile(null)
    } else if (entry.file) {
      setSelectedFile(entry.file)
    }
  }

  const handleBreadcrumb = (index: number) => {
    if (index < 0) {
      setCurrentDir("")
    } else {
      setCurrentDir(breadcrumbs.slice(0, index + 1).join("/"))
    }
    setSelectedFile(null)
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={() => handleBreadcrumb(-1)}
          className={cn(
            "rounded px-1.5 py-0.5 transition-colors hover:bg-accent",
            !currentDir ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          root
        </button>
        {breadcrumbs.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            <button
              onClick={() => handleBreadcrumb(i)}
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors hover:bg-accent",
                i === breadcrumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* File table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-full">Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDir && (
              <TableRow
                className="cursor-pointer"
                onClick={() => {
                  const parent = currentDir.includes("/")
                    ? currentDir.slice(0, currentDir.lastIndexOf("/"))
                    : ""
                  setCurrentDir(parent)
                  setSelectedFile(null)
                }}
              >
                <TableCell className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <FolderIcon className="size-4" />
                  ..
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow
                key={entry.path}
                className={cn(
                  "cursor-pointer",
                  selectedFile?.path === entry.path && "bg-accent"
                )}
                onClick={() => handleNavigate(entry)}
              >
                <TableCell className="flex items-center gap-2 py-2 text-sm">
                  {entry.isDirectory ? (
                    <FolderIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <FileIcon className="size-4 text-muted-foreground" />
                  )}
                  {entry.name}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell className="py-8 text-center text-sm text-muted-foreground">
                  No files in this directory
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* File viewer */}
      {selectedFile && <FileViewer file={selectedFile} />}
    </div>
  )
}
