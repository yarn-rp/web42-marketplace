"use client"

import { useState } from "react"
import { Eye, EyeOff, Link2 } from "lucide-react"

import type { AgentVisibility } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toggleAgentVisibility } from "@/app/actions/agent"

interface AgentVisibilityToggleProps {
  agentId: string
  currentVisibility: AgentVisibility
  profileUsername: string
}

const visibilityOptions: {
  value: AgentVisibility
  label: string
  icon: typeof Eye
}[] = [
  { value: "public", label: "Public", icon: Eye },
  { value: "unlisted", label: "Unlisted", icon: Link2 },
  { value: "private", label: "Private", icon: EyeOff },
]

function VisibilityIcon({ visibility }: { visibility: AgentVisibility }) {
  const option = visibilityOptions.find((o) => o.value === visibility)
  const Icon = option?.icon ?? Eye
  return <Icon className="size-3.5" />
}

export function AgentVisibilityToggle({
  agentId,
  currentVisibility,
  profileUsername,
}: AgentVisibilityToggleProps) {
  const [visibility, setVisibility] = useState(currentVisibility)
  const [isPending, setIsPending] = useState(false)

  const handleSelect = async (value: AgentVisibility) => {
    if (value === visibility) return
    setIsPending(true)
    const result = await toggleAgentVisibility(agentId, value, profileUsername)
    setIsPending(false)
    if (result.success) {
      setVisibility(value)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 border border-white/20 bg-black/70 text-white backdrop-blur-md shadow-sm hover:bg-black/80 hover:text-white"
          disabled={isPending}
        >
          <VisibilityIcon visibility={visibility} />
          <span className="capitalize text-xs">{visibility}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visibilityOptions.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
          >
            <opt.icon className="mr-2 size-3.5" />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
