import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { COMPLEXITY_LIST } from "@acme/core/constants";
import { and, eq } from "@acme/db";
import { modulesTable, moduleWordsTable } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getOrCreateWords, insertUserWords } from "../utils";

export const modulesRouter = createTRPCRouter({
  getModules: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().min(1),
        limit: z.number().optional().default(10),
        cursor: z.number().optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const list = await ctx.db
        .select()
        .from(modulesTable)
        .where(
          and(
            eq(modulesTable.collectionId, input.collectionId),
            eq(modulesTable.userId, ctx.session.user.id),
          ),
        )
        .limit(input.limit)
        .offset(input.cursor);

      return {
        list,
        nextCursor:
          list.length === input.limit ? input.cursor + input.limit : null,
      };
    }),
  getModule: protectedProcedure
    .input(
      z.object({
        moduleId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [module] = await ctx.db
        .select()
        .from(modulesTable)
        .where(
          and(
            eq(modulesTable.id, input.moduleId),
            eq(modulesTable.userId, ctx.session.user.id),
          ),
        );
      if (!module) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module not found!",
        });
      }
      return module;
    }),
  createModule: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(300).nullish(),
        topic: z.string(),
        complexity: z.enum(COMPLEXITY_LIST),
        languageCode: z.string().min(1),
        collectionId: z.string().min(1),
        words: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [module] = await ctx.db
        .insert(modulesTable)
        .values({
          name: input.name,
          languageCode: input.languageCode,
          userId: ctx.session.user.id,
          description: input.description,
          collectionId: input.collectionId,
          complexity: input.complexity,
          topic: input.topic,
        })
        .returning();
      if (!module) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      if (input.words && input.words.length > 0) {
        const words = await getOrCreateWords(
          input.words,
          input.languageCode,
          ctx.db,
        );
        if (words.length > 0) {
          await insertUserWords(words, ctx.session.user.id, ctx.db);
          await ctx.db
            .insert(moduleWordsTable)
            .values(
              words.map((word) => ({ moduleId: module.id, wordId: word.id })),
            );
        }
      }
      return module;
    }),
});
