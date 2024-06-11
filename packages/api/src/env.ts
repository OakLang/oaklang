import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    OPENAI_API_KEY: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: {},
  // eslint-disable-next-line no-restricted-properties
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
