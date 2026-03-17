"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, PenLine } from "lucide-react"
import { toast } from "sonner"

import { updateAgentDetails } from "@/app/actions/agent"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AgentDetailsEditorProps {
  agentId: string
  currentName: string
  currentDescription: string
  profileUsername: string
}

export function AgentDetailsEditor({
  agentId,
  currentName,
  currentDescription,
  profileUsername,
}: AgentDetailsEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(currentName)
  const [description, setDescription] = useState(currentDescription)

  const hasChanges = name !== currentName || description !== currentDescription

  const handleSave = () => {
    startTransition(async () => {
      const fields: { name?: string; description?: string } = {}
      if (name !== currentName) fields.name = name
      if (description !== currentDescription) fields.description = description

      const result = await updateAgentDetails(agentId, fields, profileUsername)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Agent details updated")
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <PenLine className="size-4" />
          General
        </CardTitle>
        <CardDescription className="text-xs">
          Update your agent&apos;s name and description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Name</Label>
          <Input
            id="agent-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Agent name"
            maxLength={100}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-description">Description</Label>
          <Textarea
            id="agent-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description of what your agent does"
            maxLength={500}
            rows={3}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground text-right">
            {description.length}/500
          </p>
        </div>
        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" />
            ) : (
              <Check className="mr-2 size-3.5" />
            )}
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
