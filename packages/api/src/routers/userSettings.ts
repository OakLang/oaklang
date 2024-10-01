import { TRPCError } from "@trpc/server";

import {
  DEFAULT_INTERLINEAR_LINES,
  DEFAULT_SPACED_REPETITION_STAGES,
} from "@acme/core/constants";
import { eq } from "@acme/db";
import { updateUserSettingsSchema, userSettings } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getUserSettings } from "../utils";

export const userSettingsRouter = createTRPCRouter({
  getUserSettings: protectedProcedure.query((opts) => {
    return getUserSettings(opts.ctx.session.user.id, opts.ctx.db);
  }),
  updateUserSettings: protectedProcedure
    .input(updateUserSettingsSchema)
    .mutation(async (opts) => {
      if (opts.input.interlinearLines) {
        const names = opts.input.interlinearLines.map((line) => line.name);
        names.forEach((name, i) => {
          if (names.findIndex((n) => n === name) !== i) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Each interlinear line name should be unique",
            });
          }
        });
      }
      if (opts.input.spacedRepetitionStages) {
        opts.input.spacedRepetitionStages =
          opts.input.spacedRepetitionStages.map((stage, i) => ({
            ...stage,
            iteration: i + 1,
          }));
      }
      const [updatedSettings] = await opts.ctx.db
        .update(userSettings)
        .set(opts.input)
        .where(eq(userSettings.userId, opts.ctx.session.user.id))
        .returning();
      if (!updatedSettings) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      return updatedSettings;
    }),
  resetInterlinearLines: protectedProcedure.mutation(async (opts) => {
    const interlinearLines = DEFAULT_INTERLINEAR_LINES;
    await opts.ctx.db
      .update(userSettings)
      .set({
        interlinearLines,
      })
      .where(eq(userSettings.userId, opts.ctx.session.user.id));
    return interlinearLines;
  }),
  resetSpacedRepetitionStages: protectedProcedure.mutation(async (opts) => {
    const spacedRepetitionStages = DEFAULT_SPACED_REPETITION_STAGES;
    await opts.ctx.db
      .update(userSettings)
      .set({
        spacedRepetitionStages,
      })
      .where(eq(userSettings.userId, opts.ctx.session.user.id));
    return spacedRepetitionStages;
  }),
});
