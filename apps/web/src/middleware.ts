import type { VerificationToken } from "next-auth/adapters";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";

import authConfig from "@acme/auth/auth-config";

import { routing } from "./i18n/routing";

const { auth } = NextAuth({
  ...authConfig,
  adapter: {
    createVerificationToken: (_: VerificationToken) => undefined,
    useVerificationToken: (_: { identifier: string; token: string }) => null,
    getUserByEmail: (_: string) => null,
  },
});

const intlMiddleware = createMiddleware(routing);

const matchPathname = (pages: string[], pathanme: string) => {
  return RegExp(
    `^(/(${routing.locales.join("|")}))?(${pages
      .flatMap((p) => (p === "/" ? ["", "/"] : p))
      .join("|")})/?$`,
    "i",
  ).test(pathanme);
};

export default auth((req) => {
  const isAuthorized = !!req.auth?.user.id;

  if (matchPathname(["/"], req.nextUrl.pathname) && isAuthorized) {
    return NextResponse.redirect(new URL("/app", req.nextUrl.origin), 307);
  }

  if (matchPathname(["/app.*"], req.nextUrl.pathname) && !isAuthorized) {
    let callbackUrl = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      callbackUrl += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(
        `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        req.nextUrl.origin,
      ),
      307,
    );
  }

  if (
    matchPathname(
      ["/login", "/signup", "/verify-request"],
      req.nextUrl.pathname,
    ) &&
    isAuthorized
  ) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    return NextResponse.redirect(
      new URL(callbackUrl ?? "/app", req.nextUrl.origin),
      307,
    );
  }

  return intlMiddleware(req);
});

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
