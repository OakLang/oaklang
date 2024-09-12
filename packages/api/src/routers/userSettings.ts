import { z } from "zod";

import type { InterlinearLine } from "@acme/core/validators";
import { interlinearLine } from "@acme/core/validators";
import { createPrefixedId, eq } from "@acme/db";
import { getDefaultInterlinearLines, userSettings } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getInterlinearLines } from "../utils";

export const userSettingsRouter = createTRPCRouter({
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
