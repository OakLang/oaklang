import { boolean, jsonb, pgTable, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import type { InterlinearLine } from "@acme/core/validators";
import { interlinearLine } from "@acme/core/validators";

import { createPrefixedId, getDefaultInterlinearLines } from "../utils";
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
    .$defaultFn(getDefaultInterlinearLines),
  autoPlayAudio: boolean("auto_play_audio").notNull().default(true),
  ttsVoice: text("tts_voice").notNull().default("alloy"),
  ttsSpeed: real("tts_speed").notNull().default(1),
  nativeLanguage: text("native_language").references(() => languages.code, {
    onDelete: "set null",
  }),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type UserSettingsInsert = typeof userSettings.$inferInsert;

export const updateUserSettingsSchema = createInsertSchema(userSettings, {
  interlinearLines: z.array(interlinearLine).min(1).optional(),
  ttsSpeed: z.number().min(0.25).max(4).optional(),
}).pick({
  autoPlayAudio: true,
  interlinearLines: true,
  ttsSpeed: true,
  ttsVoice: true,
  nativeLanguage: true,
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
