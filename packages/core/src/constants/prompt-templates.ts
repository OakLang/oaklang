import format from "string-template";

// [Start]: Extract words from a piece of text prompt
export const EXTRACT_WORDS_FROM_A_PIECE_OF_TEXT_PROMPT_TEMPLATE_KEYS = [
  "LANGUAGE",
  "PIECE_OF_TEXT",
] as const;

export const EXTRACT_WORDS_FROM_A_PIECE_OF_TEXT_PROMPT_TEMPLATE = `
Please extract all the words from the following text and return each word in its lemma form in {LANGUAGE} language. Ensure no word is omitted, and return each lemma only once, without repetition. Once a lemma has been listed, it should not appear again. Maintain the order of their first appearance. The text is as follows:

{PIECE_OF_TEXT}
`;

export const getExtractWordsFromAPieceOfTextPrompt = (
  input: Record<
    (typeof EXTRACT_WORDS_FROM_A_PIECE_OF_TEXT_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = EXTRACT_WORDS_FROM_A_PIECE_OF_TEXT_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End]: Extract words from a piece of text prompt

// [Start] Pick Relevent words for a topic prompt

export const PICK_RELEVENT_WORDS_FOR_A_TOPIC_PROMPT_TEMPLATE_KEYS = [
  "WORDS",
  "TOPIC",
  "WORD_COUNT",
] as const;

export const PICK_RELEVENT_WORDS_FOR_A_TOPIC_PROMPT_TEMPLATE = `
Pick maximum {WORD_COUNT} words form the WORDS list below which are related to the TOPIC. Do not pick any other words which are not in the WORDS list below.

WORDS: {WORDS}

TOPIC: {TOPIC}
`;

export const getPickReleventWordsForATopicPrompt = (
  input: Record<
    (typeof PICK_RELEVENT_WORDS_FOR_A_TOPIC_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = PICK_RELEVENT_WORDS_FOR_A_TOPIC_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Pick Relevent words for a topic prompt

// [Start] Generate more words without topic prompt

export const GENERATE_MORE_WORDS_WITHOUT_TOPIC_PROMPT_TEMPLATE_KEYS = [
  "WORD_COUNT",
  "PRACTICE_LANGUAGE",
  "CURRENT_WORDS",
] as const;

export const GENERATE_MORE_WORDS_WITHOUT_TOPIC_PROMPT_TEMPLATE = `
Give me a list of {WORD_COUNT} common words from {PRACTICE_LANGUAGE} language in lemma form. Also do not provide any word from the CURRENT WORDS list.

CURRENT WORDS: {CURRENT_WORDS}
`;

export const generateMoreWordsWithoutTopicPrompt = (
  input: Record<
    (typeof GENERATE_MORE_WORDS_WITHOUT_TOPIC_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = GENERATE_MORE_WORDS_WITHOUT_TOPIC_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Generate more words without topic prompt

// [Start] Generate more words with topic prompt

export const GENERATE_MORE_WORDS_WITH_TOPIC_PROMPT_TEMPLATE_KEYS = [
  "WORD_COUNT",
  "PRACTICE_LANGUAGE",
  "CURRENT_WORDS",
  "TOPIC",
] as const;

export const GENERATE_MORE_WORDS_WITH_TOPIC_PROMPT_TEMPLATE = `
Give me a list of {WORD_COUNT} common words from {PRACTICE_LANGUAGE} language in lemma form related to the topic below. Also do not provide any word from the CURRENT WORDS list.

TOPIC: {TOPIC}

CURRENT WORDS: {CURRENT_WORDS}
`;

export const generateMoreWordsWithTopicPrompt = (
  input: Record<
    (typeof GENERATE_MORE_WORDS_WITH_TOPIC_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = GENERATE_MORE_WORDS_WITH_TOPIC_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Generate more words with topic prompt

// [Start] Generate Interlinear Lines for sentence prompt

export const GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE_KEYS = [
  "PRACTICE_LANGUAGE",
  "NATIVE_LANGUAGE",
  "SENTENCE",
] as const;

export const GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE = `
You are a {PRACTICE_LANGUAGE} tutor providing detailed interlinear breakdowns for individual words in a sentence. For each word in the SENTENCE below, generate the corresponding lines based on the schema. Do not break punctuation apart from the words they are attached to; in creating this breakdown they will be considered part of that word, and be stripped as specified in certain lines.

SENTENCE: {SENTENCE}
`;

export const generateInterlinearLinesForSentencePrompt = (
  input: Record<
    (typeof GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Generate Interlinear Lines for sentence prompt

// [Start] Exercise 1: Prompt

export const EXERCISE_1_PROMPT_TEMPLATE_KEYS = [
  "PRACTICE_LANGUAGE",
  "NATIVE_LANGUAGE",
  "PRACTICE_WORDS",
  "KNOWN_WORDS",
  "PREVIOUSLY_GENERATED_SENTENCES",
  "SENTENCE_COUNT",
  "COMPLEXITY",
  "TOPIC",
] as const;

export const EXERCISE_1_PROMPT_TEMPLATE = `
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

export const getExercise1Prompt = (
  input: Record<
    (typeof EXERCISE_1_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = EXERCISE_1_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Exercise 1: Prompt

// [Start] Exercise 2: List of Words Prompt

export const EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE_KEYS = [
  "PRACTICE_LANGUAGE",
  "NATIVE_LANGUAGE",
  "WORDS",
  "EACH_WORD_PRACTICE_COUNT",
  "COMPLEXITY",
] as const;

export const EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE = `
Read the word listed below and generate an amount of {COMPLEXITY} complexity level sentences with those so that each word gets used at most {EACH_WORD_PRACTICE_COUNT} times throughout the sentences. You can use more than 1 word in a single sentence from the word list to reduce the final sentence count. 

WORDS: {WORDS}
`;

export const getExercise2ListOfWordsPrompt = (
  input: Record<
    (typeof EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Exercise 2: List of Words Prompt

// [Start] Exercise 2: Number Of Words Prompt

export const EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE_KEYS = [
  "PRACTICE_LANGUAGE",
  "NATIVE_LANGUAGE",
  "NUMBER_OF_WORDS",
  "EACH_WORD_PRACTICE_COUNT",
  "TOPIC",
  "COMPLEXITY",
] as const;

export const EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE = `

`;

export const getExercise2NumberOfWordsPrompt = (
  input: Record<
    (typeof EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Exercise 2: Number Of Words Prompt

// [Start] Exercise 2: Number Of Sentence Prompt

export const EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE_KEYS = [
  "PRACTICE_LANGUAGE",
  "NATIVE_LANGUAGE",
  "NUMBER_OF_SENTENCES",
  "TOPIC",
  "COMPLEXITY",
] as const;

export const EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE = ``;

export const getExercise2NumberOfSentencesPrompt = (
  input: Record<
    (typeof EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Exercise 2: Number Of Sentence Prompt

// [Start] Exercise 3: Ask AI Prompt

export const EXERCISE_3_ASK_AI_PROMPT_TEMPLATE_KEYS = [
  "PRACTICE_LANGUAGE",
  "NATIVE_LANGUAGE",
  "TOPIC",
  "COMPLEXITY",
] as const;

export const EXERCISE_3_ASK_AI_PROMPT_TEMPLATE = ``;

export const getExercise3AskAIPrompt = (
  input: Record<
    (typeof EXERCISE_3_ASK_AI_PROMPT_TEMPLATE_KEYS)[number],
    string | number
  >,
  template = EXERCISE_3_ASK_AI_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Exercise 3: Ask AI Prompt

// [Start] Exercise 3: Content Prompt

export const EXERCISE_3_CONTENT_PROMPT_TEMPLATE_KEYS = [
  "PRACTICE_LANGUAGE",
  "NATIVE_LANGUAGE",
  "CONTENT",
] as const;

export const EXERCISE_3_CONTENT_PROMPT_TEMPLATE = ``;

export const getExercise3ContentPrompt = (
  input: Record<
    (typeof EXERCISE_3_CONTENT_PROMPT_TEMPLATE)[number],
    string | number
  >,
  template = EXERCISE_3_CONTENT_PROMPT_TEMPLATE,
) => format(template, input).trim();

// [End] Exercise 3: Content Prompt
