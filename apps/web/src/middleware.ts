// import type { VerificationToken } from "next-auth/adapters";
// import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";

// import authConfig from "@acme/auth/auth-config";

import { routing } from "./i18n/routing";

// const { auth } = NextAuth({
//   ...authConfig,
//   adapter: {
//     createVerificationToken: (_: VerificationToken) => undefined,
//     useVerificationToken: (_: { identifier: string; token: string }) => null,
//     getUserByEmail: (_: string) => null,
//   },
// });

const intlMiddleware = createMiddleware(routing);

export default intlMiddleware;
// const matchPathname = (pages: string | string[], pathanme: string) => {
//   if (typeof pages === "string") {
//     pages = [pages];
//   }
//   return RegExp(
//     `^(/(${routing.locales.join("|")}))?(${pages
//       .flatMap((p) => (p === "/" ? ["", "/"] : p))
//       .join("|")})/?$`,
//     "i",
//   ).test(pathanme);
// };

// export default auth((req) => {
//   const isAuthorized = !!req.auth?.user.id;

//   if (matchPathname("/", req.nextUrl.pathname) && isAuthorized) {
//     const url = new URL("/app", req.nextUrl.origin);
//     req.nextUrl.pathname = url.pathname;
//     req.nextUrl.search = url.search;
//   }

//   if (matchPathname("/app.*", req.nextUrl.pathname) && !isAuthorized) {
//     let callbackUrl = req.nextUrl.pathname;
//     if (req.nextUrl.search) {
//       callbackUrl += req.nextUrl.search;
//     }
//     const url = new URL(
//       `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
//       req.nextUrl.origin,
//     );
//     req.nextUrl.pathname = url.pathname;
//     req.nextUrl.search = url.search;
//   }

//   if (
//     matchPathname(
//       ["/login", "/signup", "/verify-request"],
//       req.nextUrl.pathname,
//     ) &&
//     isAuthorized
//   ) {
//     const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
//     const url = new URL(callbackUrl ?? "/app", req.nextUrl.origin);
//     req.nextUrl.pathname = url.pathname;
//     req.nextUrl.search = url.search;
//   }

//   return intlMiddleware(req);
// });

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
