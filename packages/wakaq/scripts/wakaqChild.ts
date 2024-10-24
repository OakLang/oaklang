import { WakaQChildWorker } from "wakaq";

import { wakaq } from "../src";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as generateInterlinearLinesForSentence from "../src/tasks/generateInterlinearLinesForSentence";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as generateSentencesForExercise1 from "../src/tasks/generateSentencesForExercise1";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as generateSentencesForExercise2 from "../src/tasks/generateSentencesForExercise2";

// import your tasks so they're registered
// also make sure to enable tsc option verbatimModuleSyntax

await new WakaQChildWorker(wakaq).start();
wakaq.disconnect();
process.exit(0);
