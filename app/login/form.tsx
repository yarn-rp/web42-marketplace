"use client"

import { useSearchParams } from "next/navigation"
import { Github } from "lucide-react"
import { createClient } from "@/db/supabase/client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LoginForm() {
  const searchParams = useSearchParams()
  const cliCode = searchParams.get("cli_code")

  const handleGitHubLogin = async () => {
    const supabase = createClient()
    const callbackUrl = new URL("/auth/callback", window.location.origin)
    if (cliCode) {
      callbackUrl.searchParams.set("cli_code", cliCode)
    }

    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl.toString(),
        scopes: "read:user user:email",
      },
    })
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-2">
      <Card className="mx-auto w-[20rem] md:w-[24rem]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to Web42</CardTitle>
          <CardDescription>
            {cliCode
              ? "Sign in to authorize the Web42 CLI"
              : "Connect your GitHub account to publish and remix agent packages"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGitHubLogin}
            className="w-full"
            size="lg"
          >
            <Github className="mr-2 size-5" />
            Continue with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
