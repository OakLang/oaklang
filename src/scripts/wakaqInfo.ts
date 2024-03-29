import 'dotenv/config';

import { inspect } from 'wakaq';
import { wakaq } from '~/server/wakaq.js';

console.log(JSON.stringify(await inspect(wakaq), null, 2));
wakaq.disconnect();
