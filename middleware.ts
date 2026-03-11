import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/settings")) {
    const hasSession = request.cookies.getAll().some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    )
    if (!hasSession) {
      return NextResponse.redirect(
        new URL("/login?message=Please+sign+in+to+continue", request.url)
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/settings/:path*"],
}
