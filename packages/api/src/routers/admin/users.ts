import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, count, desc, eq, ilike, or } from "@acme/db";
import { userRole, users } from "@acme/db/schema";

import { adminProcedure, createTRPCRouter } from "../../trpc";
import { paginationBaseSchema } from "../../validators";

export const usersRouter = createTRPCRouter({
  getUsers: adminProcedure
    .input(
      paginationBaseSchema.extend({
        query: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input: { size, page, query } }) => {
      const offset = (page - 1) * size;

      const where = and(
        ...(query
          ? [
              or(
                eq(users.id, query),
                ilike(users.email, `%${query}%`),
                ilike(users.name, `%${query}%`),
              ),
            ]
          : []),
      );

      const list = await ctx.db
        .select()
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(size)
        .offset(offset);

      const totalRows = await ctx.db
        .select({ count: count() })
        .from(users)
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
    }),
  getUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId));
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No user found with id ${input.userId}`,
        });
      }
      return { ...user };
    }),
  blockUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId));
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No user found with id ${input.userId}`,
        });
      }

      const [updatedUser] = await ctx.db
        .update(users)
        .set({
          isBlocked: true,
        })
        .where(eq(users.id, user.id))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return { ...updatedUser };
    }),
  unblockUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId));
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No user found with id ${input.userId}`,
        });
      }

      const [updatedUser] = await ctx.db
        .update(users)
        .set({
          isBlocked: false,
        })
        .where(eq(users.id, user.id))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return { ...updatedUser };
    }),
  changeRole: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(userRole.enumValues) }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId));
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No user found with id ${input.userId}`,
        });
      }

      const [updatedUser] = await ctx.db
        .update(users)
        .set({
          role: input.role,
        })
        .where(eq(users.id, user.id))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return { ...updatedUser };
    }),
});
