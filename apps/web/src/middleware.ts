import type { VerificationToken } from "next-auth/adapters";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import authConfig from "@acme/auth/auth-config";

const { auth } = NextAuth({
  ...authConfig,
  adapter: {
    createVerificationToken: (_: VerificationToken) => undefined,
    useVerificationToken: (_: { identifier: string; token: string }) => null,
    getUserByEmail: (_: string) => null,
  },
});

const matchPathname = (pages: string | string[], pathanme: string) => {
  if (typeof pages === "string") {
    pages = [pages];
  }
  return RegExp(
    `^(${pages.flatMap((p) => (p === "/" ? ["", "/"] : p)).join("|")})/?$`,
    "i",
  ).test(pathanme);
};

export default auth((req) => {
  const isAuthorized = !!req.auth?.user.id;

  if (matchPathname("/", req.nextUrl.pathname) && isAuthorized) {
    const redirectUrl = new URL("/app", req.nextUrl.origin);
    return NextResponse.redirect(redirectUrl, 307);
  }
  if (matchPathname("/home", req.nextUrl.pathname) && isAuthorized) {
    const rewriteUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.rewrite(rewriteUrl);
  }

  if (matchPathname("/app.*", req.nextUrl.pathname) && !isAuthorized) {
    let callbackUrl = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      callbackUrl += req.nextUrl.search;
    }
    const redirectUrl = new URL(
      `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      req.nextUrl.origin,
    );
    return NextResponse.redirect(redirectUrl, 307);
  }

  if (
    matchPathname(
      ["/login", "/signup", "/verify-request"],
      req.nextUrl.pathname,
    ) &&
    isAuthorized
  ) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const redirectUrl = new URL(callbackUrl ?? "/app", req.nextUrl.origin);
    return NextResponse.redirect(redirectUrl, 307);
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
