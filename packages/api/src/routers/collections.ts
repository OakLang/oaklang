import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, desc, eq } from "@acme/db";
import { collectionsTable } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const collectionsRouter = createTRPCRouter({
  getCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [collection] = await ctx.db
        .select()
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.id, input.collectionId),
            eq(collectionsTable.userId, ctx.session.user.id),
          ),
        );
      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found!",
        });
      }
      return collection;
    }),
  getCollections: protectedProcedure
    .input(
      z.object({
        languageCode: z.string().min(1),
        limit: z.number().optional().default(10),
        cursor: z.number().optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const list = await ctx.db
        .select()
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.languageCode, input.languageCode),
            eq(collectionsTable.userId, ctx.session.user.id),
          ),
        )
        .limit(input.limit)
        .offset(input.cursor)
        .orderBy(desc(collectionsTable.createdAt));

      return {
        list,
        nextCursor:
          list.length === input.limit ? input.cursor + input.limit : null,
      };
    }),
  createCollection: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(300).nullish(),
        languageCode: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [collection] = await ctx.db
        .insert(collectionsTable)
        .values({
          name: input.name,
          languageCode: input.languageCode,
          userId: ctx.session.user.id,
          description: input.description,
        })
        .returning();
      if (!collection) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      return collection;
    }),
  updateCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(300).nullish(),
        languageCode: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [collection] = await ctx.db
        .select()
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.id, input.collectionId),
            eq(collectionsTable.userId, ctx.session.user.id),
          ),
        );
      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found!",
        });
      }

      const [updatedCollection] = await ctx.db
        .update(collectionsTable)
        .set({
          name: input.name,
          languageCode: input.languageCode,
          userId: ctx.session.user.id,
          description: input.description,
        })
        .where(eq(collectionsTable.id, input.collectionId))
        .returning();

      if (!updatedCollection) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return updatedCollection;
    }),
  deleteCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [collection] = await ctx.db
        .select()
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.id, input.collectionId),
            eq(collectionsTable.userId, ctx.session.user.id),
          ),
        );
      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found!",
        });
      }

      const [deletedCollection] = await ctx.db
        .delete(collectionsTable)
        .where(eq(collectionsTable.id, collection.id))
        .returning();
      if (!deletedCollection) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      return deletedCollection;
    }),
});
