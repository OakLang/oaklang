import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import type {
  InterlinearLine,
  SpacedRepetitionStage,
} from "@acme/core/validators";
import { interlinearLine, spacedRepetitionStage } from "@acme/core/validators";

import {
  createPrefixedId,
  DEFAULT_INTERLINEAR_LINES,
  DEFAULT_SPACED_REPETITION_STAGES,
} from "../utils";
import { users } from "./auth";
import { languages } from "./language";

export const userSettings = pgTable("user_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("sett")),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  interlinearLines: jsonb("interlinear_lines")
    .$type<InterlinearLine[]>()
    .notNull()
    .default(DEFAULT_INTERLINEAR_LINES),
  spacedRepetitionStages: jsonb("spaced_repetition_stages")
    .notNull()
    .$type<SpacedRepetitionStage[]>()
    .default(DEFAULT_SPACED_REPETITION_STAGES),
  autoPlayAudio: boolean("auto_play_audio").notNull().default(true),
  ttsVoice: text("tts_voice").notNull().default("alloy"),
  ttsSpeed: real("tts_speed").notNull().default(1),
  nativeLanguage: text("native_language").references(() => languages.code, {
    onDelete: "set null",
  }),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type UserSettingsInsert = typeof userSettings.$inferInsert;

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
  nativeLanguage: one(languages, {
    fields: [userSettings.nativeLanguage],
    references: [languages.code],
  }),
}));

export const updateUserSettingsSchema = createInsertSchema(userSettings, {
  interlinearLines: z.array(interlinearLine).min(1).optional(),
  spacedRepetitionStages: z.array(spacedRepetitionStage).min(1).optional(),
  ttsSpeed: z.number().min(0.25).max(4).optional(),
}).pick({
  autoPlayAudio: true,
  interlinearLines: true,
  ttsSpeed: true,
  ttsVoice: true,
  nativeLanguage: true,
  spacedRepetitionStages: true,
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
