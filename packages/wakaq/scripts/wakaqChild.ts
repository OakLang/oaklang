import { WakaQChildWorker } from "wakaq";

import { wakaq } from "../src";

// import your tasks so they're registered
// also make sure to enable tsc option verbatimModuleSyntax

await new WakaQChildWorker(wakaq).start();
process.exit(0);
