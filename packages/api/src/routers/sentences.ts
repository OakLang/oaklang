import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, asc, createSelectSchema, eq } from "@acme/db";
import {
  sentencesTable,
  sentenceWordsTable,
  userWordsTable,
  wordsTable,
} from "@acme/db/schema";
import { generateInterlinearLineForSentence } from "@acme/wakaq/tasks/generateInterlinearLineForSentence";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getSentenceOrThrow,
  getTrainingSessionOrThrow,
  insertUserWords,
} from "../utils";

export const sentencesRouter = createTRPCRouter({
  getSentences: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .output(z.array(createSelectSchema(sentencesTable)))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        trainingSessionId,
        db,
        session,
      );
      return db
        .select()
        .from(sentencesTable)
        .where(eq(sentencesTable.trainingSessionId, trainingSession.id))
        .orderBy(asc(sentencesTable.index));
    }),
  getSentence: protectedProcedure
    .input(z.object({ sentenceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sentence = await getSentenceOrThrow(input.sentenceId, ctx);
      const words = await ctx.db
        .select()
        .from(sentenceWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, sentenceWordsTable.wordId))
        .leftJoin(
          userWordsTable,
          and(
            eq(userWordsTable.wordId, sentenceWordsTable.wordId),
            eq(userWordsTable.userId, ctx.session.user.id),
          ),
        )
        .where(eq(sentenceWordsTable.sentenceId, input.sentenceId))
        .orderBy(asc(sentenceWordsTable.index));

      const wordsWithNoUserWord = words
        .filter((word) => word.user_word === null)
        .map((word) => word.word);
      if (wordsWithNoUserWord.length > 0) {
        await insertUserWords(wordsWithNoUserWord, ctx.session.user.id, ctx.db);
      }

      return {
        ...sentence,
        words: words.map((item) => ({
          ...item.sentence_word,
          word: item.word,
          userWord: item.user_word,
        })),
      };
    }),
  regenerateSentenceInterlinearLines: protectedProcedure
    .input(z.object({ sentenceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sentence = await getSentenceOrThrow(input.sentenceId, ctx);
      if (
        sentence.interlinearLineGenerationStatus === "failed" ||
        sentence.interlinearLineGenerationStatus === "canceled"
      ) {
        await ctx.db
          .update(sentencesTable)
          .set({ interlinearLineGenerationStatus: "idle" })
          .where(eq(sentencesTable.id, sentence.id));
        await generateInterlinearLineForSentence.enqueue({
          sentenceId: sentence.id,
        });
      }
    }),
  markSentenceComplete: protectedProcedure
    .input(z.object({ sentenceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sentence = await getSentenceOrThrow(input.sentenceId, ctx);
      if (sentence.completedAt) {
        return sentence;
      }

      const [updatedSentence] = await ctx.db
        .update(sentencesTable)
        .set({
          completedAt: new Date(),
        })
        .where(eq(sentencesTable.id, sentence.id))
        .returning();
      if (!updatedSentence) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      return updatedSentence;
    }),
});
