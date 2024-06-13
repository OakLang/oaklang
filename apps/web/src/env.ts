/* eslint-disable no-restricted-properties */
import { createEnv } from "@t3-oss/env-nextjs";

import { env as apiEnv } from "@acme/api/env";
import { env as authEnv } from "@acme/auth/env";
import { env as dbEnv } from "@acme/db/env";

export const env = createEnv({
  extends: [authEnv, dbEnv, apiEnv],
  shared: {},
  server: {},
  client: {},
  experimental__runtimeEnv: {},
  skipValidation:
    !!process.env.CI ||
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
});
