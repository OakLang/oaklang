import type { ZodString } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import type { InterlinearLine } from "@acme/core/validators";
import { DEFAULT_INTERLINEAR_LINES_PROMPT_TEMPLATE } from "@acme/core/constants";
import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  languagesTable,
  sentencesTable,
  sentenceWordsTable,
  trainingSessionsTable,
} from "@acme/db/schema";

import { wakaq } from "..";
import {
  getInterlinearLines,
  getNativeLanguage,
  getOrCreateWords,
} from "../helpers";

const buildSentenceWordsGPTSchema = ({
  nativeLanguage,
  practiceLanguage,
  interlinearLines,
}: {
  interlinearLines: InterlinearLine[];
  nativeLanguage: string;
  practiceLanguage: string;
}) => {
  const wordSchema: Record<string, ZodString> = {};
  interlinearLines.forEach((line) => {
    if (line.name && line.description) {
      wordSchema[line.name] = z.string().describe(
        stringTemplate(line.description, {
          PRACTICE_LANGUAGE: practiceLanguage,
          NATIVE_LANGUAGE: nativeLanguage,
        }),
      );
    }
  });

  return z.object({
    words: z.array(z.object(wordSchema)),
  });
};

export const generateInterlinearLineForSentence = wakaq.task(
  async (args) => {
    const { sentenceId } = await z
      .object({ sentenceId: z.string() })
      .parseAsync(args);
    wakaq.logger?.info(
      `Running Task: generateInterlinearLineForSentence. Sentence id: ${sentenceId}`,
    );

    const [sentence] = await db
      .select({
        sentence: sentencesTable.sentence,
        interlinearLineGenerationStatus:
          sentencesTable.interlinearLineGenerationStatus,
        trainingSessionId: sentencesTable.trainingSessionId,
        languageCode: trainingSessionsTable.languageCode,
        userId: trainingSessionsTable.userId,
        language: languagesTable,
      })
      .from(sentencesTable)
      .innerJoin(
        trainingSessionsTable,
        eq(trainingSessionsTable.id, sentencesTable.trainingSessionId),
      )
      .innerJoin(
        languagesTable,
        eq(languagesTable.code, trainingSessionsTable.languageCode),
      )
      .where(eq(sentencesTable.id, sentenceId));

    if (!sentence) {
      throw new Error(`No Sentence found with id ${sentenceId}`);
    }

    if (sentence.interlinearLineGenerationStatus === "pending") {
      throw new Error("Interlinear lines are already being generated");
    }

    if (sentence.interlinearLineGenerationStatus === "success") {
      throw new Error("Interlinear lines already generated");
    }

    await db
      .update(sentencesTable)
      .set({
        interlinearLineGenerationStatus: "pending",
      })
      .where(eq(sentencesTable.id, sentenceId));
    try {
      wakaq.logger?.info("Deleting previous sentence words!");

      await db
        .delete(sentenceWordsTable)
        .where(eq(sentenceWordsTable.sentenceId, sentenceId));

      const nativeLanguage = await getNativeLanguage(sentence.userId);
      const interlinearLines = await getInterlinearLines(sentence.userId);

      const prompt = stringTemplate(DEFAULT_INTERLINEAR_LINES_PROMPT_TEMPLATE, {
        PRACTICE_LANGUAGE: sentence.language.name,
        NATIVE_LANGUAGE: nativeLanguage.name,
        SENTENCE: sentence.sentence,
      });

      const schema = buildSentenceWordsGPTSchema({
        nativeLanguage: nativeLanguage.name,
        practiceLanguage: sentence.language.name,
        interlinearLines,
      });

      const result = await generateObject({
        model: openai("gpt-4o", { user: sentence.userId }),
        prompt,
        schema,
      });

      const filterdInterlinearColumns = result.object.words as unknown as {
        word: string;
        lemma: string;
        text: string;
        [x: string]: string;
      }[];

      const primaryWords = filterdInterlinearColumns.map((item) => item.lemma);
      const insertedWords = await getOrCreateWords(
        primaryWords,
        sentence.languageCode,
      );

      const values = filterdInterlinearColumns
        .map((column, index) => {
          const wordId = insertedWords.find(
            (word) => word.word === column.lemma,
          )?.id;
          if (!wordId) {
            return null;
          }

          return {
            index,
            sentenceId,
            interlinearLines: column,
            wordId,
          } satisfies typeof sentenceWordsTable.$inferInsert;
        })
        .filter((item) => !!item);

      if (values.length > 0) {
        await db.insert(sentenceWordsTable).values(values);
      }

      await db
        .update(sentencesTable)
        .set({
          interlinearLineGenerationStatus: "success",
        })
        .where(eq(sentencesTable.id, sentenceId));
    } catch (error) {
      console.error(error);
      await db
        .update(sentencesTable)
        .set({
          interlinearLineGenerationStatus: "failed",
        })
        .where(eq(sentencesTable.id, sentenceId));
    }
  },
  { name: "generateInterlinearLineForSentence" },
);
