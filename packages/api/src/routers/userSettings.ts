import { TRPCError } from "@trpc/server";

import type { InterlinearLine } from "@acme/core/validators";
import { createPrefixedId, eq, getDefaultInterlinearLines } from "@acme/db";
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
    const interlinearLines = (userSettings.interlinearLines.defaultFn?.() ??
      getDefaultInterlinearLines()) as unknown as InterlinearLine[];
    await opts.ctx.db
      .update(userSettings)
      .set({
        interlinearLines,
      })
      .where(eq(userSettings.userId, opts.ctx.session.user.id));
    return interlinearLines;
  }),
  addNewInterlinearLine: protectedProcedure.mutation(async (opts) => {
    const settings = await getUserSettings(
      opts.ctx.session.user.id,
      opts.ctx.db,
    );
    const newList: InterlinearLine[] = [
      ...settings.interlinearLines,
      {
        id: createPrefixedId("inter"),
        name: "new_line",
        description: "Description for new Line",
        disappearing: "default",
        style: {},
      },
    ];
    await opts.ctx.db.update(userSettings).set({
      interlinearLines: newList,
    });
    return newList;
  }),
});
