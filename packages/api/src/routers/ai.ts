import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { nanoid } from "nanoid";

import type { Sentence, SentencesGeneratorSettings } from "@acme/validators";
import {
  generateSentenceBody,
  generateSentenceObjectSchema,
} from "@acme/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const buildPrompt = ({
  knownVocabs,
  practiceVocabs,
  settings,
}: {
  knownVocabs: string[];
  practiceVocabs: string[];
  settings: SentencesGeneratorSettings;
}) => {
  return settings.prompt
    .replaceAll("{{SENTENCE_COUNT}}", String(settings.sentencesCount))
    .replaceAll("{{PRACTICE_LANGUAGE}}", settings.practiceLanguage)
    .replaceAll("{{HELP_LANGUAGE}}", settings.helpLanguage)
    .replaceAll("{{PRACTICE_VOCABS}}", practiceVocabs.join(", "))
    .replaceAll("{{KNOWN_VOCABS}}", knownVocabs.join(", "))
    .replaceAll("{{COMPLEXITY}}", settings.complexity);
};

export const aiRouter = createTRPCRouter({
  generateSentences: protectedProcedure
    .input(generateSentenceBody)
    .mutation(
      async ({
        input: { knownVocabs, practiceVocabs, settings },
        ctx: { session },
      }) => {
        const prompt = buildPrompt({ knownVocabs, practiceVocabs, settings });
        const result = await generateObject({
          model: openai("gpt-4o", { user: session.user.id }),
          prompt,
          schema: generateSentenceObjectSchema,
        });

        return result.object.sentences.map<Sentence & { id: string }>(
          (sentence) => ({
            ...sentence,
            id: nanoid(),
          }),
        );
      },
    ),
});
