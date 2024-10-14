import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, asc, count, desc, eq, inArray } from "@acme/db";
import {
  languagesTable,
  practiceLanguagesTable,
  trainingSessionsTable,
  userWordsTable,
  wordsTable,
} from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { getKnownWordsCountForLanguage, getLanguageOrThrow } from "../utils";
import { languageWithStats } from "../validators";

export const languagesRouter = createTRPCRouter({
  getLanguages: publicProcedure.query(({ ctx: { db } }) =>
    db.select().from(languagesTable).orderBy(asc(languagesTable.name)),
  ),
  getLanguage: publicProcedure
    .input(z.object({ languageCode: z.string() }))
    .query(({ ctx, input }) => getLanguageOrThrow(input.languageCode, ctx.db)),
  getPracticeLanguages: protectedProcedure
    .output(z.array(languageWithStats))
    .query(async ({ ctx }) => {
      const languageList = await ctx.db
        .select()
        .from(practiceLanguagesTable)
        .innerJoin(
          languagesTable,
          eq(languagesTable.code, practiceLanguagesTable.languageCode),
        )
        .where(eq(practiceLanguagesTable.userId, ctx.session.user.id))
        .orderBy(desc(practiceLanguagesTable.createdAt));
      return Promise.all(
        languageList.map(async (lang) => {
          return {
            ...lang.language,
            knownWords: await getKnownWordsCountForLanguage(
              lang.language.code,
              ctx.session,
              ctx.db,
            ),
          };
        }),
      );
    }),
  getPracticeLanguage: protectedProcedure
    .input(z.object({ languageCode: z.string() }))
    .output(languageWithStats)
    .query(async ({ ctx, input }) => {
      const language = await getLanguageOrThrow(input.languageCode, ctx.db);

      const [practiceLanguage] = await ctx.db
        .select()
        .from(practiceLanguagesTable)
        .where(
          and(
            eq(practiceLanguagesTable.languageCode, language.code),
            eq(practiceLanguagesTable.userId, ctx.session.user.id),
          ),
        );

      if (!practiceLanguage) {
        const [newPracticeLanguage] = await ctx.db
          .insert(practiceLanguagesTable)
          .values({
            languageCode: language.code,
            userId: ctx.session.user.id,
          })
          .returning();
        if (!newPracticeLanguage) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
        return {
          ...language,
          knownWords: 0,
        };
      }

      await ctx.db
        .update(practiceLanguagesTable)
        .set({
          lastPracticed: new Date(),
        })
        .where(
          and(
            eq(
              practiceLanguagesTable.languageCode,
              practiceLanguage.languageCode,
            ),
            eq(practiceLanguagesTable.userId, practiceLanguage.userId),
          ),
        );

      return {
        ...language,
        knownWords: await getKnownWordsCountForLanguage(
          language.code,
          ctx.session,
          ctx.db,
        ),
      };
    }),
  deletePracticeLanguage: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [practiceLanguage] = await ctx.db
        .select()
        .from(practiceLanguagesTable)
        .innerJoin(
          languagesTable,
          eq(languagesTable.code, practiceLanguagesTable.languageCode),
        )
        .where(
          and(
            eq(practiceLanguagesTable.languageCode, input.languageCode),
            eq(practiceLanguagesTable.userId, ctx.session.user.id),
          ),
        );

      if (!practiceLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice language not found!",
        });
      }

      const [practiceLanguagesCount] = await ctx.db
        .select({ count: count() })
        .from(practiceLanguagesTable)
        .where(eq(practiceLanguagesTable.userId, ctx.session.user.id));

      if ((practiceLanguagesCount?.count ?? 0) <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "At least one practice language is required. Please add another language before deleting the current one to ensure your practice setup remains complete.",
        });
      }

      // Delete The Practice Language
      await ctx.db
        .delete(practiceLanguagesTable)
        .where(
          and(
            eq(practiceLanguagesTable.languageCode, input.languageCode),
            eq(practiceLanguagesTable.userId, ctx.session.user.id),
          ),
        );

      // Delete Training Sessions
      await ctx.db
        .delete(trainingSessionsTable)
        .where(
          and(
            eq(trainingSessionsTable.userId, ctx.session.user.id),
            eq(trainingSessionsTable.languageCode, input.languageCode),
          ),
        );

      // Delete User Words
      const userWordsList = await ctx.db
        .select({ id: userWordsTable.wordId })
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(
          and(
            eq(userWordsTable.userId, ctx.session.user.id),
            eq(wordsTable.languageCode, input.languageCode),
          ),
        );

      await ctx.db.delete(userWordsTable).where(
        inArray(
          userWordsTable.wordId,
          userWordsList.map((word) => word.id),
        ),
      );

      return practiceLanguage;
    }),
  getLastPracticeLanguage: protectedProcedure.query(async ({ ctx }) => {
    const [lang] = await ctx.db
      .select()
      .from(practiceLanguagesTable)
      .where(eq(practiceLanguagesTable.userId, ctx.session.user.id))
      .orderBy(desc(practiceLanguagesTable.lastPracticed))
      .limit(1);
    return lang ?? null;
  }),
});
