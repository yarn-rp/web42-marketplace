import { LogoAnimationLink } from "@/components/nav"
import { LoginHero } from "@/components/login-hero"

import { LoginForm } from "./form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
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
