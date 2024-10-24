import { WakaQScheduler } from "wakaq";

import { wakaq } from "../src";

await new WakaQScheduler(wakaq).start();
wakaq.disconnect();
process.exit(0);
