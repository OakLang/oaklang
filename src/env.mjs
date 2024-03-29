import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'test', 'production']),
    GITHUB_LOGIN_APP_ID: z.string(),
    GITHUB_LOGIN_SECRET: z.string(),
  },

  /**
   * To expose vars to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {},

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    GITHUB_LOGIN_APP_ID: process.env.GITHUB_LOGIN_APP_ID,
    GITHUB_LOGIN_SECRET: process.env.GITHUB_LOGIN_SECRET,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
