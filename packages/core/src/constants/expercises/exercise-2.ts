import type { Exercise } from "./exercise";
import { Exercises } from "./exercise";

// Available Keys
// 1. {PRACTICE_LANGUAGE}
// 2. {NATIVE_LANGUAGE}
// 3. {WORDS} // Comma seperated list of words e.g. i, love, coffee
// 4. {EACH_WORD_PRACTICE_COUNT}
// 5. {COMPLEXITY}
const EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE = `
Read the word listed below and generate a amount of {COMPLEXITY} complexity level sentences with those so that each word gets used at most {EACH_WORD_PRACTICE_COUNT} times throughout the sentences. You can use more than 1 word in a single sentence from the word list to reduce the final sentence count. 

WORDS: {WORDS}
`;

// Available Keys
// 1. {PRACTICE_LANGUAGE}
// 2. {NATIVE_LANGUAGE}
// 3. {NUMBER_OF_WORDS}
// 4. {EACH_WORD_PRACTICE_COUNT}
// 5. {TOPIC}
// 6. {COMPLEXITY}
const EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE = ``;

// Available Keys
// 1. {PRACTICE_LANGUAGE}
// 2. {NATIVE_LANGUAGE}
// 4. {NUMBER_OF_SENTENCES}
// 5. {TOPIC}
// 6. {COMPLEXITY}
const EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE = ``;

export const EXERCISE_2 = {
  id: Exercises.exercise2,
  name: "Session Sentence Practice",
  promptTemplates: {
    listOfWords: EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE,
    numberOfWords: EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE,
    numberOfSentences: EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE,
  },
} satisfies Exercise;
