import {
  numPendingEtaTasksInQueue,
  numPendingTasksInQueue,
  purgeEtaQueue,
  purgeQueue,
} from "wakaq";

import { wakaq } from "../src";

const queueName = process.argv.slice(2)[0];
const queue = wakaq.queuesByName.get(queueName ?? "");
if (!queue) {
  throw new Error(`Queue not found: ${queueName}`);
}
await wakaq.connect();
let count = await numPendingTasksInQueue(wakaq, queue);
await purgeQueue(wakaq, queue);
count += await numPendingEtaTasksInQueue(wakaq, queue);
await purgeEtaQueue(wakaq, queue);
console.log(`Purged ${count} tasks from ${queue.name}`);
wakaq.disconnect();
