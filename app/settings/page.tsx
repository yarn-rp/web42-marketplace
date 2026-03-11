import { redirect } from "next/navigation"

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
import { Separator } from "@/components/ui/separator"
import { FadeIn } from "@/components/cult/fade-in"
import { ThemeSelector } from "@/components/theme-selector"
import { getCurrentProfile, updateProfile } from "@/app/actions/profile"

export default async function SettingsPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <FadeIn>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-6">Manage your profile</p>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your public profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile.username ?? ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Username is set from your GitHub account and cannot be changed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Display Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile.full_name ?? ""}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  name="bio"
                  defaultValue={profile.bio ?? ""}
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  defaultValue={profile.website ?? ""}
                  placeholder="https://yoursite.com"
                />
              </div>

              <Button type="submit">Save Changes</Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose your preferred theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle>CLI Authentication</CardTitle>
            <CardDescription>
              Use the CLI to push and install agent packages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Run the following command to authenticate the Web42 CLI with your
              account:
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 font-mono text-sm">
              <code>web42 auth login</code>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
