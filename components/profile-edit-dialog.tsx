"use client"

import { useState, useTransition } from "react"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import type { Profile } from "@/lib/types"
import { updateProfile } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProfileEditDialogProps {
  profile: Profile
}

export function ProfileEditDialog({ profile }: ProfileEditDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Profile updated")
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="size-3.5" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile information
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              value={profile.username ?? ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Username is set from your GitHub account and cannot be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-full_name">Display Name</Label>
            <Input
              id="edit-full_name"
              name="full_name"
              defaultValue={profile.full_name ?? ""}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-bio">Bio</Label>
            <Input
              id="edit-bio"
              name="bio"
              defaultValue={profile.bio ?? ""}
              placeholder="Tell us about yourself"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-website">Website</Label>
            <Input
              id="edit-website"
              name="website"
              defaultValue={profile.website ?? ""}
              placeholder="https://yoursite.com"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
