"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { updateProfileReadme } from "@/app/actions/profile"

interface ProfileReadmeEditorProps {
  initialContent: string
}

export function ProfileReadmeEditor({ initialContent }: ProfileReadmeEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isPending, setIsPending] = useState(false)

  const handleSave = async () => {
    setIsPending(true)
    await updateProfileReadme(content)
    setIsPending(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile README</CardTitle>
        <CardDescription>
          Tell others about yourself. Supports Markdown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# About me\n\nWrite your profile README here..."
              className="min-h-[200px] font-mono text-sm"
              rows={12}
            />
            <Button
              className="mt-4"
              onClick={handleSave}
              disabled={isPending}
            >
              Save
            </Button>
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <div className="rounded-lg border bg-muted/30 p-6">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing to preview yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
