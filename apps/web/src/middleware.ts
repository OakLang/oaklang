import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import authConfig from "@acme/auth/auth-config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const pathParts = req.nextUrl.pathname.split("/");
  const language = pathParts[1];

  if (pathParts[2] === "app" && !req.auth) {
    const redirectUrl = new URL(
      `/${language}${authConfig.pages.signIn}`,
      req.nextUrl.origin,
    );
    redirectUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(redirectUrl, 307);
  }

  return NextResponse.next();
});

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
