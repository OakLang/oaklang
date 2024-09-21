import { createTRPCRouter } from "../trpc";

export const wordsRouter = createTRPCRouter({
  // getWords: protectedProcedure
  //   .input(
  //     z.object({
  //       trainingSessionId: z.string(),
  //       isKnown: z.boolean().optional(),
  //       isPracticing: z.boolean().optional(),
  //     }),
  //   )
  //   .query(
  //     async ({ ctx: { db, session }, input: { isKnown, isPracticing } }) => {
  //       const practiceWords = await db
  //         .select()
  //         .from(words)
  //         .where(
  //           and(
  //             eq(words.userId, session.user.id),
  //             ...(typeof isPracticing !== "undefined"
  //               ? [eq(words.isPracticing, isPracticing)]
  //               : []),
  //             ...(typeof isKnown !== "undefined"
  //               ? [eq(words.isKnown, isKnown)]
  //               : []),
  //           ),
  //         )
  //         .orderBy(asc(words.word));
  //       return practiceWords;
  //     },
  //   ),
  // createOrUpdateWords: protectedProcedure
  //   .input(
  //     z.object({
  //       trainingSessionId: z.string(),
  //       words: z.array(z.string()).min(1).max(100),
  //       isKnown: z.boolean().optional(),
  //       isPracticing: z.boolean().optional(),
  //     }),
  //   )
  //   .mutation(
  //     async ({
  //       ctx: { db, session },
  //       input: { words: wordsList, isKnown, isPracticing },
  //     }) => {
  //       const newWords = await db
  //         .insert(words)
  //         .values(
  //           wordsList.map(
  //             (word) =>
  //               ({
  //                 userId: session.user.id,
  //                 word,
  //                 isKnown,
  //                 isPracticing,
  //               }) satisfies typeof words.$inferInsert,
  //           ),
  //         )
  //         .onConflictDoUpdate({
  //           target: [words.userId, words.word],
  //           set: {
  //             isKnown:
  //               typeof isKnown === "undefined"
  //                 ? sql`${words.isKnown}`
  //                 : isKnown,
  //             isPracticing:
  //               typeof isPracticing === "undefined"
  //                 ? sql`${words.isPracticing}`
  //                 : isPracticing,
  //           },
  //         })
  //         .returning();
  //       return newWords;
  //     },
  //   ),
  // deleteWords: protectedProcedure
  //   .input(
  //     z.object({
  //       trainingSessionId: z.string(),
  //       words: z.array(z.string()).min(1).max(100),
  //     }),
  //   )
  //   .mutation(async ({ ctx: { db, session }, input: { words: wordsList } }) => {
  //     const deletedWords = await db
  //       .delete(words)
  //       .where(
  //         and(
  //           eq(words.userId, session.user.id),
  //           inArray(words.word, wordsList),
  //         ),
  //       )
  //       .returning();
  //     return deletedWords;
  //   }),
});
