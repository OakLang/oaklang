import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, eq, sql } from "@acme/db";
import { userWords, words } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const wordsRouter = createTRPCRouter({
  getUserWord: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [word] = await ctx.db
        .select()
        .from(userWords)
        .innerJoin(words, eq(words.id, userWords.wordId))
        .where(
          and(
            eq(userWords.wordId, input.wordId),
            eq(userWords.userId, ctx.session.user.id),
          ),
        );
      if (!word) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Word not found!" });
      }
      return {
        ...word.user_word,
        word: word.word,
      };
    }),
  seenWords: protectedProcedure
    .input(z.array(z.string()).min(1))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userWords)
        .values(
          input.map(
            (wordId) =>
              ({
                wordId,
                userId: ctx.session.user.id,
              }) satisfies typeof userWords.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [userWords.userId, userWords.wordId],
          set: {
            lastSeenAt: sql`NOW()`,
            seenCount: sql`${userWords.seenCount} + 1`,
          },
        });
    }),
  markWordKnown: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userWords)
        .values({
          knownAt: new Date(),
          userId: ctx.session.user.id,
          wordId: input.wordId,
        })
        .onConflictDoUpdate({
          target: [userWords.userId, userWords.wordId],
          set: {
            knownAt: new Date(),
          },
        });
    }),
  markWordUnknown: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userWords)
        .values({
          userId: ctx.session.user.id,
          wordId: input.wordId,
        })
        .onConflictDoUpdate({
          target: [userWords.userId, userWords.wordId],
          set: {
            knownAt: null,
          },
        });
    }),
});
