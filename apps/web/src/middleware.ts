import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";

import authConfig from "@acme/auth/auth-config";

import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const pathParts = req.nextUrl.pathname.split("/");

  if (pathParts[2] === "app" && !req.auth) {
    const redirectUrl = new URL("/login", req.nextUrl.origin);
    redirectUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(redirectUrl, 307);
  }

  if (pathParts[2] === "login" && req.auth) {
    const redirectUrl = new URL(
      req.nextUrl.searchParams.get("callbackUrl") ?? "/app",
      req.nextUrl.origin,
    );
    return NextResponse.redirect(redirectUrl, 307);
  }

  return createMiddleware(routing)(req);
});

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
