import type { NextAuthConfig, Session as NextAuthSession } from "next-auth";
import { skipCSRFCheck } from "@auth/core";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { APP_NAME } from "@acme/core/constants";
import { resend } from "@acme/email";
import VerificationRequest from "@acme/email/emails/verification-request";

import { adapter } from "./adapter";
import authConfig from "./auth-config";
import { env } from "./env";

export const isSecureContext = env.NODE_ENV !== "development";

export const nextAuthConfig = {
  ...authConfig,
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY,
      sendVerificationRequest: async ({ url, identifier }) => {
        const { error } = await resend.emails.send({
          from: `Sign in to ${APP_NAME} <no_reply@oaklang.com>`,
          to: identifier,
          subject: `Sign in to ${APP_NAME}`,
          react: VerificationRequest({
            title: `Sign in to ${APP_NAME}`,
            url,
            appName: APP_NAME,
          }),
        });
        if (error) {
          throw new Error(error.message);
        }
      },
    }),
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  adapter,
  ...(!isSecureContext
    ? {
        skipCSRFCheck: skipCSRFCheck,
        trustHost: true,
      }
    : {}),
  debug: !isSecureContext,
  callbacks: {
    ...authConfig.callbacks,
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
