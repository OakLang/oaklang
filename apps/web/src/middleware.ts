import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";

import authConfig from "@acme/auth/auth-config";

import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  return intlMiddleware(req);
});

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/", "/(de|en)/:path*"],
};
