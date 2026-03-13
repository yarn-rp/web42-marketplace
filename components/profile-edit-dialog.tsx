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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface ProfileEditDialogProps {
  profile: Profile
}

export function ProfileEditDialog({ profile }: ProfileEditDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [readme, setReadme] = useState(profile.profile_readme ?? "")

  const handleSubmit = (formData: FormData) => {
    formData.set("profile_readme", readme)
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="edit-website">Website</Label>
            <Input
              id="edit-website"
              name="website"
              defaultValue={profile.website ?? ""}
              placeholder="https://yoursite.com"
            />
          </div>

          <div className="space-y-2">
            <Label>About</Label>
            <Tabs defaultValue="edit">
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="text-xs">Edit</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={readme}
                  onChange={(e) => setReadme(e.target.value)}
                  placeholder="Tell others about yourself. Supports Markdown."
                  className="min-h-[160px] font-mono text-sm"
                  rows={8}
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="rounded-lg border bg-muted/30 p-4 min-h-[160px]">
                  {readme ? (
                    <MarkdownRenderer content={readme} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nothing to preview yet.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
