import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes only accessible when NOT logged in
const authRoutes = ["/", "/signin", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isLoggedIn = !!(accessToken || refreshToken);

  // Logged in → block access to auth pages, redirect to dashboard
  if (isLoggedIn && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Not logged in → block access to protected pages, redirect to signin
  if (!isLoggedIn && !authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
