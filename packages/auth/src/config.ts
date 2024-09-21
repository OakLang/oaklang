import type {
  DefaultSession,
  NextAuthConfig,
  Session as NextAuthSession,
} from "next-auth";
import { skipCSRFCheck } from "@auth/core";

import { adapter } from "./adapter";
import authConfig from "./auth-config";
import { env } from "./env";

export const isSecureContext = env.NODE_ENV !== "development";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const nextAuthConfig = {
  ...authConfig,
  adapter,
  ...(!isSecureContext
    ? {
        skipCSRFCheck: skipCSRFCheck,
        trustHost: true,
      }
    : {}),
  // debug: !isSecureContext,
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
