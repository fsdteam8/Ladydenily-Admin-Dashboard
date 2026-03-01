import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl
  const isAdmin = token?.role === "admin"

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/trainer", "/user", "/courses", "/signal-send", "/offer"]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // If accessing a protected route without a token or as a non-admin, redirect to login
  if (isProtectedRoute && (!token || !isAdmin)) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    if (token && !isAdmin) {
      loginUrl.searchParams.set("error", "admin_only")
    }
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated admin user tries to access auth pages, redirect to dashboard
  if (token && isAdmin && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trainer/:path*",
    "/user/:path*",
    "/courses/:path*",
    "/signal-send/:path*",
    "/offer/:path*",
    "/auth/:path*",
  ],
}
