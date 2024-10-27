import type { Exercise } from "./exercise";
import {
  getExercise2ListOfWordsPrompt,
  getExercise2NumberOfSentencesPrompt,
  getExercise2NumberOfWordsPrompt,
} from "../prompt-templates";
import { Exercises } from "./exercise";

export const Exercise2 = {
  id: Exercises.exercise2,
  name: "Session Sentence Practice",
  getListOfWordsPrompt: getExercise2ListOfWordsPrompt,
  getNumberOfWordsPrompt: getExercise2NumberOfWordsPrompt,
  getNumberOfSentencesPrompt: getExercise2NumberOfSentencesPrompt,
} satisfies Exercise;
