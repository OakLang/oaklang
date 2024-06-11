import type { NextAuthConfig, Session as NextAuthSession } from "next-auth";
import { skipCSRFCheck } from "@auth/core";
import Google from "next-auth/providers/google";

import { adapter } from "./adapter";
import { env } from "./env";

export const isSecureContext = env.NODE_ENV !== "development";

export const authConfig = {
  adapter,
  skipCSRFCheck: isSecureContext ? undefined : skipCSRFCheck,
  trustHost: !isSecureContext,
  secret: env.AUTH_SECRET,
  providers: [Google],
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;

export const validateToken = async (
  token: string,
): Promise<NextAuthSession | null> => {
  const sessionToken = token.slice("Bearer ".length);
  const session = await adapter.getSessionAndUser?.(sessionToken);
  return session
    ? {
        user: {
          ...session.user,
        },
        expires: session.session.expires.toISOString(),
      }
    : null;
};

export const invalidateSessionToken = async (token: string) => {
  await adapter.deleteSession?.(token);
};
