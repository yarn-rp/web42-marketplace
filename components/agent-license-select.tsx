"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Scale } from "lucide-react"
import { toast } from "sonner"

import type { AgentLicense } from "@/lib/types"
import { updateAgentLicense } from "@/app/actions/agent"
import { getAllowedLicenses } from "@/lib/license-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AgentLicenseSelectProps {
  agentId: string
  currentLicense: AgentLicense | null
  priceCents: number
  profileUsername: string
}

const LICENSE_OPTIONS: { value: AgentLicense; label: string; description: string }[] = [
  {
    value: "MIT",
    label: "MIT",
    description: "Permissive, minimal restrictions",
  },
  {
    value: "Apache-2.0",
    label: "Apache 2.0",
    description: "Permissive with patent protection",
  },
  {
    value: "GPL-3.0",
    label: "GPL 3.0",
    description: "Copyleft, derivatives must be open",
  },
  {
    value: "BSD-3-Clause",
    label: "BSD 3-Clause",
    description: "Permissive, no endorsement clause",
  },
  {
    value: "Proprietary",
    label: "Proprietary",
    description: "All rights reserved",
  },
  {
    value: "Custom",
    label: "Custom",
    description: "Custom license terms",
  },
]

export function AgentLicenseSelect({
  agentId,
  currentLicense,
  priceCents,
  profileUsername,
}: AgentLicenseSelectProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState<AgentLicense | "">(currentLicense ?? "")

  const allowedLicenses = getAllowedLicenses(priceCents)
  const filteredOptions = LICENSE_OPTIONS.filter((opt) =>
    allowedLicenses.includes(opt.value)
  )

  const handleChange = (newValue: string) => {
    const license = newValue as AgentLicense
    setValue(license)
    startTransition(async () => {
      const result = await updateAgentLicense(agentId, license, profileUsername)
      if (result.error) {
        toast.error(result.error)
        setValue(currentLicense ?? "")
      } else {
        toast.success("License updated")
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Scale className="size-4" />
          License
        </CardTitle>
        <CardDescription className="text-xs">
          {priceCents === 0
            ? "Free agents require an open-source license."
            : "Paid agents require a commercial license."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={value}
          onValueChange={handleChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a license" />
          </SelectTrigger>
          <SelectContent>
            {filteredOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex flex-col">
                  <span>{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
