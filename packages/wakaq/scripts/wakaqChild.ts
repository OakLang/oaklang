import { WakaQChildWorker } from "wakaq";

import { wakaq } from "../src";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as generateSentences from "../src/tasks/generate-sentences";

// import your tasks so they're registered
// also make sure to enable tsc option verbatimModuleSyntax

await new WakaQChildWorker(wakaq).start();
process.exit(0);
