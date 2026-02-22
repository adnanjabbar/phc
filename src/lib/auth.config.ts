import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const publicRoutes = ["/", "/login", "/register", "/api/register"];
      const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );
      if (isPublicRoute) return true;
      if (!isLoggedIn) return false;
      return true;
    },
  },
  providers: [],
};
