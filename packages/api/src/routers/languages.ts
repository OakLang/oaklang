import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, count, desc, eq } from "@acme/db";
import {
  languages,
  practiceLanguages,
  trainingSessions,
} from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { getKnownWordsCountForLanguage } from "../utils";
import { languageWithStats } from "../validators";

export const languagesRouter = createTRPCRouter({
  getLanguages: publicProcedure.query(async ({ ctx: { db } }) => {
    const languagesList = await db.select().from(languages);
    return languagesList;
  }),
  getPracticeLanguages: protectedProcedure
    .output(z.array(languageWithStats))
    .query(async ({ ctx }) => {
      const languageList = await ctx.db
        .select()
        .from(practiceLanguages)
        .innerJoin(
          languages,
          eq(languages.code, practiceLanguages.languageCode),
        )
        .where(eq(practiceLanguages.userId, ctx.session.user.id))
        .orderBy(desc(practiceLanguages.createdAt));
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
  getLastPracticeLanguage: protectedProcedure.query(async ({ ctx }) => {
    const [lang] = await ctx.db
      .select()
      .from(practiceLanguages)
      .where(eq(practiceLanguages.userId, ctx.session.user.id))
      .orderBy(desc(practiceLanguages.lastPracticed))
      .limit(1);
    return lang ?? null;
  }),
  getPracticeLanguage: protectedProcedure
    .input(z.string())
    .output(languageWithStats)
    .query(async ({ ctx, input }) => {
      const [language] = await ctx.db
        .select()
        .from(languages)
        .where(eq(languages.code, input));

      if (!language) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Language not found!",
        });
      }

      const [practiceLanguage] = await ctx.db
        .select()
        .from(practiceLanguages)
        .where(
          and(
            eq(practiceLanguages.languageCode, language.code),
            eq(practiceLanguages.userId, ctx.session.user.id),
          ),
        );

      if (!practiceLanguage) {
        const [newPracticeLanguage] = await ctx.db
          .insert(practiceLanguages)
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
        .update(practiceLanguages)
        .set({
          lastPracticed: new Date(),
        })
        .where(
          and(
            eq(practiceLanguages.languageCode, practiceLanguage.languageCode),
            eq(practiceLanguages.userId, practiceLanguage.userId),
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
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const [practiceLanguage] = await ctx.db
        .select()
        .from(practiceLanguages)
        .innerJoin(
          languages,
          eq(languages.code, practiceLanguages.languageCode),
        )
        .where(
          and(
            eq(practiceLanguages.languageCode, input),
            eq(practiceLanguages.userId, ctx.session.user.id),
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
        .from(practiceLanguages)
        .where(eq(practiceLanguages.userId, ctx.session.user.id));

      if (!practiceLanguagesCount) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      if (practiceLanguagesCount.count <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "At least one practice language is required. Please add another language before deleting the current one to ensure your practice setup remains complete.",
        });
      }

      // Delete The Practice Language
      await ctx.db
        .delete(practiceLanguages)
        .where(
          and(
            eq(practiceLanguages.languageCode, input),
            eq(practiceLanguages.userId, ctx.session.user.id),
          ),
        );

      // Delete Training Sessions
      await ctx.db
        .delete(trainingSessions)
        .where(
          and(
            eq(trainingSessions.userId, ctx.session.user.id),
            eq(trainingSessions.languageCode, input),
          ),
        );

      return practiceLanguage;
    }),
});
