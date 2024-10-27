import type { Exercise } from "./exercise";
import { getExercise1Prompt } from "../prompt-templates";
import { Exercises } from "./exercise";

export const Exercise1 = {
  id: Exercises.exercise1,
  name: "Infinite Sentence Practice",
  description: "",
  getPrompt: getExercise1Prompt,
} satisfies Exercise;
