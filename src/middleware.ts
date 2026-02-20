import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth(function middleware(req: NextRequest & { auth: { user?: { role?: string } } | null }) {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const user = session?.user;

  // If user is authenticated and trying to access login page, redirect to their dashboard
  if (pathname === "/login" || pathname === "/") {
    if (user) {
      const role = user.role;
      if (role === "REGX") return NextResponse.redirect(new URL("/regx", req.url));
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
      if (role === "MSDS_FOCAL") return NextResponse.redirect(new URL("/focal", req.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith("/regx")) {
    if (!user) return NextResponse.redirect(new URL("/login", req.url));
    if (user.role !== "REGX") return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/login", req.url));
    if (user.role !== "ADMIN") return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/focal")) {
    if (!user) return NextResponse.redirect(new URL("/login", req.url));
    if (user.role !== "MSDS_FOCAL") return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/login", "/regx/:path*", "/admin/:path*", "/focal/:path*"],
};
