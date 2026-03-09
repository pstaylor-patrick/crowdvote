import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/auth";

const PROTECTED_PATHS = ["/dashboard", "/session"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect host/admin routes
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // If no ADMIN_PASSWORD env var is set, skip auth entirely (dev mode)
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return NextResponse.next();

  // Check for admin_token cookie
  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validate token
  if (!validateAdminToken(token, adminPassword)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/session/:path*"],
};
