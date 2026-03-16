import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

import { LogoAnimationLink } from "@/components/nav"
import { LoginHero } from "@/components/login-hero"
import { createClient as createServerClient } from "@/db/supabase/server"

import { LoginForm } from "./form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string; cli_code?: string }
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const cliCode = searchParams?.cli_code

  if (user && cliCode) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabaseAdmin
      .from("cli_auth_codes")
      .update({ user_id: user.id, status: "confirmed" })
      .eq("code", cliCode)
      .eq("status", "pending")

    redirect("/login/cli-success")
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <LoginHero />

      <div className="flex flex-col items-center justify-center px-4 py-12">
        <div className="absolute left-4 top-4 lg:hidden">
          <LogoAnimationLink />
        </div>

        <LoginForm />

        {searchParams?.message && (
          <p className="mt-4 max-w-sm rounded-md bg-foreground/10 p-4 text-center text-sm text-foreground">
            {searchParams.message}
          </p>
        )}
      </div>
    </div>
  )
}
