import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { User } from "@acme/db/schema";
import { and, count, desc, eq, gte, ilike, lte, or } from "@acme/db";
import { aiUsageTable, usersTable } from "@acme/db/schema";

import { adminProcedure, createTRPCRouter } from "../../trpc";
import { paginationBaseSchema } from "../../validators";

export const aiUsageRouter = createTRPCRouter({
  getAIUsageList: adminProcedure
    .input(
      paginationBaseSchema.extend({
        query: z.string().optional(),
        minTokenCount: z.number().min(0).optional(),
        maxTokenCount: z.number().min(0).optional(),
        model: z.string().optional(),
        generationType: z
          .enum(aiUsageTable.generationType.enumValues)
          .optional(),
      }),
    )
    .query(
      async ({
        ctx,
        input: {
          size,
          page,
          query,
          maxTokenCount,
          minTokenCount,
          model,
          generationType,
        },
      }) => {
        const offset = (page - 1) * size;

        const uuid = z.string().uuid().safeParse(query);

        const where = and(
          ...(query
            ? [
                or(
                  ...(uuid.success ? [eq(aiUsageTable.id, uuid.data)] : []),
                  eq(aiUsageTable.userId, query),
                  ilike(aiUsageTable.type, `%${query}%`),
                  ilike(aiUsageTable.userEmail, `%${query}%`),
                ),
              ]
            : []),
          ...(model !== undefined ? [eq(aiUsageTable.model, model)] : []),
          ...(generationType !== undefined
            ? [eq(aiUsageTable.generationType, generationType)]
            : []),
          ...(minTokenCount !== undefined
            ? [gte(aiUsageTable.tokenCount, minTokenCount)]
            : []),
          ...(maxTokenCount !== undefined
            ? [lte(aiUsageTable.tokenCount, maxTokenCount)]
            : []),
        );

        const list = await ctx.db
          .select()
          .from(aiUsageTable)
          .where(where)
          .orderBy(desc(aiUsageTable.createdAt))
          .limit(size)
          .offset(offset);

        const totalRows = await ctx.db
          .select({ count: count() })
          .from(aiUsageTable)
          .where(where);

        const totalRowsCount = totalRows[0]?.count ?? 0;

        let nextPage: number | null = null;
        if (offset + size < totalRowsCount) {
          nextPage = page + 1;
        }

        return {
          list,
          previousPage: page > 1 ? page - 1 : null,
          nextPage,
          page,
          limit: size,
          total: totalRowsCount,
        };
      },
    ),
  getAIUsage: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [usage] = await ctx.db
        .select()
        .from(aiUsageTable)
        .where(eq(aiUsageTable.id, input.id));
      if (!usage) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usage not found!" });
      }

      let user: User | null = null;
      if (usage.userId) {
        const [u] = await ctx.db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, usage.userId));
        if (u) {
          user = u;
        }
      }

      return {
        ...usage,
        user,
      };
    }),
});
