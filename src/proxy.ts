import { auth } from "@/auth"
import { NextResponse } from "next/server"

if (
  process.env.DEMO_MODE === "true" &&
  process.env.NODE_ENV === "production"
) {
  console.warn(
    "⚠ DEMO_MODE=true in a production build — authentication is BYPASSED " +
      "for every route. Unset DEMO_MODE before exposing this deployment."
  )
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes — always accessible
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/auth")

  if (isPublicRoute) {
    // Redirect logged-in users away from login page
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // Demo mode: allow all access without auth
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.next()
  }

  // Protected routes — require auth
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except static files and _next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
