"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Github, Loader2, Mail } from "lucide-react"
import { createClient } from "@/db/supabase/client"

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

type Mode = "login" | "signup"

export function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const cliCode = searchParams.get("cli_code")

  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (signUpError) {
          setError(signUpError.message)
          return
        }
        setError(null)
        setMode("login")
        alert("Check your email for a confirmation link.")
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (cliCode) {
        const res = await fetch("/api/auth/cli/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: cliCode }),
        })
        if (res.ok) {
          router.push("/login/cli-success")
        } else {
          router.push("/")
        }
      } else {
        router.push("/")
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === "login"

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {isLogin ? "Sign in to Web42" : "Create an account"}
        </CardTitle>
        <CardDescription>
          {cliCode
            ? "Sign in to authorize the Web42 CLI"
            : isLogin
              ? "Connect to publish and remix agent packages"
              : "Get started with the AI agent marketplace"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          onClick={handleGitHubLogin}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Github className="mr-2 size-5" />
          Continue with GitHub
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Mail className="mr-2 size-4" />
            )}
            {isLogin ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isLogin ? "signup" : "login")
              setError(null)
            }}
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </CardContent>
    </Card>
  )
}
