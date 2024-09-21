import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";

import authConfig from "@acme/auth/auth-config";

import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

const protectedPages = ["/app/*"];
const authPages = ["/login"];

const testPagesRegex = (pages: string[], pathname: string) => {
  const regex = `^(/(${routing.locales.join("|")}))?(${pages
    .map((p) => p.replace("/*", ".*"))
    .join("|")})/?$`;
  return new RegExp(regex, "i").test(pathname);
};

export default auth((req) => {
  const response = intlMiddleware(req);
  const isAuth = !!req.auth;
  const isProtectedPage = testPagesRegex(protectedPages, req.nextUrl.pathname);
  const isAuthPage = testPagesRegex(authPages, req.nextUrl.pathname);

  if (!isAuth && isProtectedPage) {
    const redirectUrl = new URL("/login", req.nextUrl.origin);
    redirectUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(redirectUrl, 307);
  }

  if (isAuth && isAuthPage) {
    const redirectUrl = new URL(
      req.nextUrl.searchParams.get("callbackUrl") ?? "/app",
      req.nextUrl.origin,
    );
    return NextResponse.redirect(redirectUrl, 307);
  }

  return response;
});

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
