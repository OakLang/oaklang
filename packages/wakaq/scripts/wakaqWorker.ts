import "dotenv/config";

import { WakaQWorker } from "wakaq";

import { wakaq } from "../src";
import { env } from "../src/env";

console.log({
  REDIS_HOST: env.REDIS_HOST,
  REDIS_PASSWORD: env.REDIS_PASSWORD,
  REDIS_PORT: env.REDIS_PORT,
  REDIS_USERNAME: env.REDIS_USERNAME,
});

// Can't use tsx directly because it breaks IPC (https://github.com/esbuild-kit/tsx/issues/201)
await new WakaQWorker(wakaq, [
  "node",
  "--no-warnings=ExperimentalWarning",
  "--import",
  "tsx",
  "scripts/wakaqChild.ts",
]).start();
wakaq.disconnect();
process.exit(0);
