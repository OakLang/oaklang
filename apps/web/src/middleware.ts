import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import authConfig from "@acme/auth/auth-config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (req.nextUrl.pathname.startsWith("/app") && !req.auth) {
    const redirectUrl = new URL(authConfig.pages.signIn, req.nextUrl.origin);
    redirectUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(redirectUrl, 307);
  }
  if (req.nextUrl.pathname === "/" && req.auth) {
    return NextResponse.redirect(new URL("/app", req.url), 307);
  }
  if (req.nextUrl.pathname === "/home") {
    return NextResponse.rewrite(new URL("/", req.url));
  }
  return NextResponse.next();
});

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
