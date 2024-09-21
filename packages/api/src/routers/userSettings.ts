import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { InterlinearLine } from "@acme/core/validators";
import { interlinearLine } from "@acme/core/validators";
import { createPrefixedId, eq, getDefaultInterlinearLines } from "@acme/db";
import { updateUserSettingsSchema, userSettings } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getInterlinearLines, getUserSettings } from "../utils";

export const userSettingsRouter = createTRPCRouter({
  getUserSettings: protectedProcedure.query((opts) => {
    console.log("GET USER SETTINGS CALLED =============");
    return getUserSettings(opts.ctx.session.user.id, opts.ctx.db);
  }),
  updateUserSettings: protectedProcedure
    .input(updateUserSettingsSchema)
    .mutation(async (opts) => {
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
  getInterlinearLines: protectedProcedure.query(async (opts) => {
    return getInterlinearLines(opts.ctx.session.user.id, opts.ctx.db);
  }),
  updateInterlinearLines: protectedProcedure
    .input(z.array(interlinearLine).min(1))
    .mutation(async (opts) => {
      await opts.ctx.db
        .update(userSettings)
        .set({
          interlinearLines: opts.input,
        })
        .where(eq(userSettings.userId, opts.ctx.session.user.id));
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
    const interlinearLines = await getInterlinearLines(
      opts.ctx.session.user.id,
      opts.ctx.db,
    );
    const newList: InterlinearLine[] = [
      ...interlinearLines,
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
