import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import type {
  InterlinearLines,
  Prompts,
  SpacedRepetitionStage,
} from "@acme/core/validators";
import {
  DEFAULT_INTERLINEAR_LINES,
  DEFAULT_SPACED_REPETITION_STAGES,
} from "@acme/core/constants";
import {
  interlinearLines,
  prompts,
  spacedRepetitionStage,
} from "@acme/core/validators";

import { createPrefixedId } from "../utils";
import { usersTable } from "./auth";
import { languagesTable } from "./language";

export const userSettingsTable = pgTable("user_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("sett")),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  interlinearLines: jsonb("interlinear_lines")
    .$type<InterlinearLines>()
    .notNull()
    .default(DEFAULT_INTERLINEAR_LINES),
  spacedRepetitionStages: jsonb("spaced_repetition_stages")
    .notNull()
    .$type<SpacedRepetitionStage[]>()
    .default(DEFAULT_SPACED_REPETITION_STAGES),
  autoPlayAudio: boolean("auto_play_audio").notNull().default(false),
  ttsVoice: text("tts_voice").notNull().default("alloy"),
  ttsSpeed: real("tts_speed").notNull().default(1),
  nativeLanguage: text("native_language").references(
    () => languagesTable.code,
    { onDelete: "set null" },
  ),
  prompts: jsonb("prompts").notNull().$type<Prompts>().default({}),
});

export type UserSettings = typeof userSettingsTable.$inferSelect;
export type UserSettingsInsert = typeof userSettingsTable.$inferInsert;

export const userSettingsRelations = relations(
  userSettingsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userSettingsTable.userId],
      references: [usersTable.id],
    }),
    nativeLanguage: one(languagesTable, {
      fields: [userSettingsTable.nativeLanguage],
      references: [languagesTable.code],
    }),
  }),
);

export const updateUserSettingsSchema = createInsertSchema(userSettingsTable, {
  interlinearLines,
  prompts,
  spacedRepetitionStages: z.array(spacedRepetitionStage).min(1),
  ttsSpeed: z.number().min(0.25).max(4),
}).pick({
  autoPlayAudio: true,
  interlinearLines: true,
  ttsSpeed: true,
  ttsVoice: true,
  nativeLanguage: true,
  spacedRepetitionStages: true,
  prompts: true,
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
