import { inspect } from "wakaq";

import { wakaq } from "../src";

console.log(JSON.stringify(await inspect(await wakaq.connect()), null, 2));

wakaq.disconnect();
