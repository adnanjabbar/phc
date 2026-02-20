import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Node.js-only modules)
// Used by middleware for JWT-based route protection
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const pathname = nextUrl.pathname;

      // Redirect authenticated users away from login page
      if (pathname === "/login" || pathname === "/") {
        if (user) {
          const role = user.role as string;
          if (role === "REGX") return Response.redirect(new URL("/regx", nextUrl));
          if (role === "ADMIN") return Response.redirect(new URL("/admin", nextUrl));
          if (role === "MSDS_FOCAL") return Response.redirect(new URL("/focal", nextUrl));
        }
        return true;
      }

      // Protect /regx routes - only REGX
      if (pathname.startsWith("/regx")) {
        if (!user) return Response.redirect(new URL("/login", nextUrl));
        if ((user.role as string) !== "REGX") return Response.redirect(new URL("/login", nextUrl));
        return true;
      }

      // Protect /admin routes - only ADMIN
      if (pathname.startsWith("/admin")) {
        if (!user) return Response.redirect(new URL("/login", nextUrl));
        if ((user.role as string) !== "ADMIN") return Response.redirect(new URL("/login", nextUrl));
        return true;
      }

      // Protect /focal routes - only MSDS_FOCAL
      if (pathname.startsWith("/focal")) {
        if (!user) return Response.redirect(new URL("/login", nextUrl));
        if ((user.role as string) !== "MSDS_FOCAL") return Response.redirect(new URL("/login", nextUrl));
        return true;
      }

      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
  session: {
    strategy: "jwt",
  },
};
