import type { ZodString } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import type { InterlinearLine } from "@acme/core/validators";
import { generateInterlinearLinesForSentencePrompt } from "@acme/core/constants/prompt-templates";
import { hasPowerUserAccess } from "@acme/core/helpers";
import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  aiUsageTable,
  languagesTable,
  sentencesTable,
  sentenceWordsTable,
  trainingSessionsTable,
  usersTable,
} from "@acme/db/schema";

import { wakaq } from "..";
import {
  getInterlinearLines,
  getNativeLanguage,
  getOrCreateWords,
  getUserSettingsPrompts,
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
        userId: usersTable.id,
        userEmail: usersTable.email,
        userRole: usersTable.role,
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
      .innerJoin(usersTable, eq(usersTable.id, trainingSessionsTable.userId))
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

      const practiceLanguage = sentence.language;
      const nativeLanguage = await getNativeLanguage(sentence.userId);
      const interlinearLines = await getInterlinearLines(sentence.userId);
      const prompts = await getUserSettingsPrompts(sentence.userId);

      let customPromptTemplate: string | undefined = undefined;

      if (
        hasPowerUserAccess(sentence.userRole) &&
        prompts["interlinear-lines-for-sentence"]?.override &&
        prompts["interlinear-lines-for-sentence"].prompt
      ) {
        customPromptTemplate = prompts["interlinear-lines-for-sentence"].prompt;
      }

      const prompt = generateInterlinearLinesForSentencePrompt(
        {
          NATIVE_LANGUAGE: nativeLanguage.name,
          PRACTICE_LANGUAGE: practiceLanguage.name,
          SENTENCE: sentence.sentence,
        },
        customPromptTemplate,
      );

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

      await db.insert(aiUsageTable).values({
        platform: "openai",
        model: "gpt-4o",
        generationType: "object",
        prompt,
        result,
        tokenCount: result.usage.totalTokens,
        userId: sentence.userId,
        userEmail: sentence.userEmail,
        metadata: {
          trainingSessionId: sentence.trainingSessionId,
          sentenceId: sentenceId,
          zodSchema: schema,
          words: result.object.words,
        },
      });

      const filterdInterlinearColumns = result.object.words as unknown as {
        word: string;
        lemma: string;
        text: string;
        [x: string]: string;
      }[];

      const uniqueWords = [
        ...new Set(filterdInterlinearColumns.map((item) => item.lemma)),
      ];
      const insertedWords = await getOrCreateWords(
        uniqueWords,
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
