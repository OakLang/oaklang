import type { PromptMode } from "../validators";

const TRAINING_SESSION_PROMPT_01 = `
You are an expert {PRACTICE_LANGUAGE} tutor specializing in creating effective practice exercises for students. Your task is to generate a set of sentences that help a student practice new vocabulary at their current proficiency level. Each sentence should:

	•	Be grammatically correct and contextually natural.
	•	Use words primarily from the PRACTICE WORDS list while limiting other vocabulary to the most relevant words from the KNOWN WORDS list.
	•	Match the student’s {COMPLEXITY} proficiency level in {PRACTICE_LANGUAGE}.
	•	Ensure variety in sentence structure, avoiding repetition of PREVIOUSLY GENERATED SENTENCES.
	•	Align with the natural flow of {PRACTICE_LANGUAGE}, while maximizing the usage of PRACTICE WORDS in a meaningful way.

Please generate {SENTENCE_COUNT} sentences based on the following constraints:

PRACTICE WORDS: {PRACTICE_WORDS}

KNOWN WORDS: {KNOWN_WORDS}

PREVIOUSLY GENERATED SENTENCES: 
{PREVIOUSLY_GENERATED_SENTENCES}
`;

export const DEFAULT_PROMPT_MODES: PromptMode[] = [
  {
    id: "c4cH2ZiJi8oXE7HSMz0px",
    for: "training-session",
    name: "Prompt 1",
    prompt: TRAINING_SESSION_PROMPT_01.trim(),
  },
];
