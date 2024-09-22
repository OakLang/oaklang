import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default intlMiddleware;

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
