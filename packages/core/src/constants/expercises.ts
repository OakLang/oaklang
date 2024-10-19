export const Exercises = {
  exercies1: "exercise-1",
  exercies2: "exercise-2",
  exercies3: "exercise-3",
} as const;

const _exercise_ids = Object.values(Exercises);

export interface Exercise {
  id: (typeof _exercise_ids)[number];
  name: string;
  description?: string | null;
  [x: string]: unknown;
}

const exercise1PromptTemplate = `
You are an expert {PRACTICE_LANGUAGE} tutor specializing in creating effective practice exercises for students. Your task is to generate a set of sentences that help a student practice new vocabulary at their current proficiency level. Each sentence should:

	•	Be grammatically correct and contextually natural.
	•	Use words primarily from the PRACTICE WORDS list while limiting other vocabulary to the most relevant words from the KNOWN WORDS list.
	• If no PRACTICE WORDS are provided, you may select a set of words yourself and use only those to generate sentences.
	•	Match the student’s {COMPLEXITY} proficiency level in {PRACTICE_LANGUAGE}.
	•	Ensure variety in sentence structure, avoiding repetition of PREVIOUSLY GENERATED SENTENCES.
	•	Align with the natural flow of {PRACTICE_LANGUAGE}, while maximizing the usage of PRACTICE WORDS in a meaningful way.
  • Generate sentences centered around the provided {TOPIC} if specified.

Please generate {SENTENCE_COUNT} sentences based on the following constraints:

PRACTICE WORDS: {PRACTICE_WORDS}

KNOWN WORDS: {KNOWN_WORDS}

TOPIC: {TOPIC}

PREVIOUSLY GENERATED SENTENCES: 
{PREVIOUSLY_GENERATED_SENTENCES}
`;

export const EXERCISE_1_PROMPT_TEMPLATE_KEYS = [
  "{PRACTICE_LANGUAGE}",
  "{NATIVE_LANGUAGE}",
  "{PRACTICE_WORDS}",
  "{KNOWN_WORDS}",
  "{PREVIOUSLY_GENERATED_SENTENCES}",
  "{SENTENCE_COUNT}",
  "{COMPLEXITY}",
  "{TOPIC}",
];

export const EXERCISE_1 = {
  id: Exercises.exercies1,
  name: "Infinite Sentence Practice",
  promptTemplate: exercise1PromptTemplate.trim(),
} satisfies Exercise;

export const EXERCISE_2 = {
  id: Exercises.exercies2,
  name: "Session Sentence Practice",
} satisfies Exercise;

export const EXERCISE_3 = {
  id: Exercises.exercies3,
  name: "Content Practice",
} satisfies Exercise;

export const EXERCISES = [EXERCISE_1, EXERCISE_2, EXERCISE_3];
