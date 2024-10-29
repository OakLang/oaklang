import { TRPCError } from "@trpc/server";

import {
  DEFAULT_INTERLINEAR_LINES,
  DEFAULT_SPACED_REPETITION_STAGES,
} from "@acme/core/constants";
import { hasPowerUserAccess } from "@acme/core/helpers";
import { eq } from "@acme/db";
import { updateUserSettingsSchema, userSettingsTable } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getUserSettings } from "../utils";

export const userSettingsRouter = createTRPCRouter({
  getUserSettings: protectedProcedure.query((opts) => {
    return getUserSettings(opts.ctx);
  }),
  updateUserSettings: protectedProcedure
    .input(updateUserSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      if (
        (input.interlinearLines ?? input.prompts) &&
        !hasPowerUserAccess(ctx.session.user.role)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have power user access",
        });
      }

      const [updatedSettings] = await ctx.db
        .update(userSettingsTable)
        .set(input)
        .where(eq(userSettingsTable.userId, ctx.session.user.id))
        .returning();
      if (!updatedSettings) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      return updatedSettings;
    }),
  resetInterlinearLines: protectedProcedure.mutation(async (opts) => {
    const interlinearLines = DEFAULT_INTERLINEAR_LINES;
    await opts.ctx.db
      .update(userSettingsTable)
      .set({
        interlinearLines,
      })
      .where(eq(userSettingsTable.userId, opts.ctx.session.user.id));
    return interlinearLines;
  }),
  resetSpacedRepetitionStages: protectedProcedure.mutation(async (opts) => {
    const spacedRepetitionStages = DEFAULT_SPACED_REPETITION_STAGES;
    await opts.ctx.db
      .update(userSettingsTable)
      .set({
        spacedRepetitionStages,
      })
      .where(eq(userSettingsTable.userId, opts.ctx.session.user.id));
    return spacedRepetitionStages;
  }),
});
