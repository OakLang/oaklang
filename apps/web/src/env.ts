/* eslint-disable no-restricted-properties */
import { createEnv } from '@t3-oss/env-nextjs';

import { env as authEnv } from '@acme/auth/env';
import { env as dbEnv } from '@acme/db/env';
import { env as apiEnv } from '@acme/api/env';

export const env = createEnv({
  extends: [authEnv, dbEnv, apiEnv],
  shared: {},
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {},

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === 'lint',
});
