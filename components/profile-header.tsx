import { ExternalLink, Github } from "lucide-react"

import type { Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileHeaderProps {
  profile: Profile
  totalStars: number
  agentCount: number
}

export function ProfileHeader({
  profile,
  totalStars,
  agentCount,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-start gap-6 mb-8">
      <Avatar className="size-20">
        <AvatarImage src={profile.avatar_url ?? undefined} />
        <AvatarFallback className="text-2xl">
          {(profile.username ?? "U")[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h1 className="text-2xl font-bold">
          {profile.full_name || profile.username}
        </h1>
        <p className="text-muted-foreground">@{profile.username}</p>
        {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3.5" />
              Website
            </a>
          )}
          {profile.github_handle && (
            <a
              href={`https://github.com/${profile.github_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Github className="size-3.5" />
              {profile.github_handle}
            </a>
          )}
          <span>{totalStars} total stars</span>
          <span>{agentCount} agents</span>
        </div>
      </div>
    </div>
  )
}
