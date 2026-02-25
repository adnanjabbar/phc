import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Only run auth for dashboard routes; do not match _next or static assets
  matcher: [
    "/admin/:path*",
    "/regx/:path*",
    "/consultant/:path*",
    "/focal/:path*",
  ],
};