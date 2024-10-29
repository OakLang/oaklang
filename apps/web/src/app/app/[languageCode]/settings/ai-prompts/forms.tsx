"use client";

import { Exercise1, Exercise2, Exercise3 } from "@acme/core/constants";
import {
  EXERCISE_1_PROMPT_TEMPLATE,
  EXERCISE_1_PROMPT_TEMPLATE_KEYS,
  EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE,
  EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE_KEYS,
  EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE,
  EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE_KEYS,
  EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE,
  EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE_KEYS,
  EXERCISE_3_ASK_AI_PROMPT_TEMPLATE,
  EXERCISE_3_ASK_AI_PROMPT_TEMPLATE_KEYS,
  EXERCISE_3_CONTENT_PROMPT_TEMPLATE,
  EXERCISE_3_CONTENT_PROMPT_TEMPLATE_KEYS,
  GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE,
  GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE_KEYS,
} from "@acme/core/constants/prompt-templates";

import PromptCard from "./prompt-card";

export default function Forms() {
  return (
    <>
      <PromptCard
        id="exercise-1"
        title={`${Exercise1.name}`}
        defaultPrompt={EXERCISE_1_PROMPT_TEMPLATE.trim()}
        keys={EXERCISE_1_PROMPT_TEMPLATE_KEYS as unknown as string[]}
      />
      <PromptCard
        id="exercise-2.list-of-words"
        title={`${Exercise2.name} - List of Words`}
        defaultPrompt={EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE.trim()}
        keys={
          EXERCISE_2_LIST_OF_WORDS_PROMPT_TEMPLATE_KEYS as unknown as string[]
        }
      />
      <PromptCard
        id="exercise-2.number-of-words"
        title={`${Exercise2.name} - Number of Words`}
        defaultPrompt={EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE.trim()}
        keys={
          EXERCISE_2_NUMBER_OF_WORDS_PROMPT_TEMPLATE_KEYS as unknown as string[]
        }
      />
      <PromptCard
        id="exercise-2.number-of-sentences"
        title={`${Exercise2.name} - Number of Sentences`}
        defaultPrompt={EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE.trim()}
        keys={
          EXERCISE_2_NUMBER_OF_SENTENCES_PROMPT_TEMPLATE_KEYS as unknown as string[]
        }
      />
      <PromptCard
        id="exercise-3.ask-ai"
        title={`${Exercise3.name} - Ask AI`}
        defaultPrompt={EXERCISE_3_ASK_AI_PROMPT_TEMPLATE.trim()}
        keys={EXERCISE_3_ASK_AI_PROMPT_TEMPLATE_KEYS as unknown as string[]}
      />
      <PromptCard
        id="exercise-3.content"
        title={`${Exercise3.name} - Content`}
        defaultPrompt={EXERCISE_3_CONTENT_PROMPT_TEMPLATE.trim()}
        keys={EXERCISE_3_CONTENT_PROMPT_TEMPLATE_KEYS as unknown as string[]}
      />
      <PromptCard
        id="interlinear-lines-for-sentence"
        title={`Generate Interlinear lines for Sentence`}
        defaultPrompt={GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE.trim()}
        keys={
          GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE_KEYS as unknown as string[]
        }
      />
    </>
  );
}
