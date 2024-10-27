import type { Exercise } from "./exercise";
import {
  getExercise3AskAIPrompt,
  getExercise3ContentPrompt,
} from "../prompt-templates";
import { Exercises } from "./exercise";

export const Exercise3 = {
  id: Exercises.exercise3,
  name: "Content Practice",
  getAskAIPrompt: getExercise3AskAIPrompt,
  getContentPrompt: getExercise3ContentPrompt,
} satisfies Exercise;
