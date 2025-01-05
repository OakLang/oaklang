import { WakaQChildWorker } from "wakaq";

import { wakaq } from "../src";
import { generateInterlinearLineForSentence } from "../src/tasks/generateInterlinearLineForSentence";
import { generateSentencesForExercise1 } from "../src/tasks/generateSentencesForExercise1";
import { generateSentencesForExercise2 } from "../src/tasks/generateSentencesForExercise2";
import { generateSentencesForExercise3 } from "../src/tasks/generateSentencesForExercise3";

// import your tasks so they're registered
// also make sure to enable tsc option verbatimModuleSyntax

const _tasks = [
  generateInterlinearLineForSentence,
  generateSentencesForExercise1,
  generateSentencesForExercise2,
  generateSentencesForExercise3,
];

await new WakaQChildWorker(wakaq).start();
wakaq.disconnect();
process.exit(0);
