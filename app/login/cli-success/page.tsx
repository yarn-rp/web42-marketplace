import { LogoAnimationLink } from "@/components/nav"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CliSuccessPage() {
  return (
    <div>
      <div className="absolute top-2 left-2">
        <LogoAnimationLink />
      </div>
      <div className="w-full flex flex-col items-center justify-center gap-2 pt-24">
        <Card className="mx-auto w-[20rem] md:w-[24rem]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">CLI Authorized</CardTitle>
            <CardDescription>
              You can close this tab and return to your terminal.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            The Web42 CLI is now authenticated.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
