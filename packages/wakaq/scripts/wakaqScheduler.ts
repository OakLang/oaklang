import { WakaQScheduler } from "wakaq";

import { wakaq } from "../src";

await new WakaQScheduler(wakaq).start();
process.exit(0);
