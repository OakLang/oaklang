import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { eq, sql } from "@acme/db";
import { practiceWords } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const wordsRouter = createTRPCRouter({
  getPracticeWord: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [word] = await ctx.db
        .select()
        .from(practiceWords)
        .where(eq(practiceWords.wordId, input.wordId));
      if (!word) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Word not found!" });
      }
      return word;
    }),
  addPracticeWords: protectedProcedure
    .input(
      z.object({
        wordIds: z.array(z.string()).min(1),
        markKnow: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(practiceWords)
        .values(
          input.wordIds.map(
            (wordId) =>
              ({
                wordId,
                userId: ctx.session.user.id,
                knownAt: input.markKnow ? new Date() : undefined,
              }) satisfies typeof practiceWords.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [practiceWords.userId, practiceWords.wordId],
          set: {
            practiceCount: sql`${practiceWords.practiceCount} + 1`,
            lastSeenAt: sql`NOW()`,
          },
        });
    }),
  markWordKnown: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(practiceWords)
        .values({
          knownAt: new Date(),
          userId: ctx.session.user.id,
          wordId: input.wordId,
        })
        .onConflictDoUpdate({
          target: [practiceWords.userId, practiceWords.wordId],
          set: {
            knownAt: new Date(),
          },
        });
    }),
  markWordUnknown: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(practiceWords)
        .values({
          userId: ctx.session.user.id,
          wordId: input.wordId,
        })
        .onConflictDoUpdate({
          target: [practiceWords.userId, practiceWords.wordId],
          set: {
            knownAt: null,
          },
        });
    }),
});
