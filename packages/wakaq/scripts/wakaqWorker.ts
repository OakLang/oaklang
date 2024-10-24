import "dotenv/config";

import { WakaQWorker } from "wakaq";

import { wakaq } from "../src";

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
