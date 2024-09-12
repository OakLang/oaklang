import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import type { InterlinearLine } from "@acme/core/validators";

import { createPrefixedId } from "../utils";
import { users } from "./auth";

export const getDefaultInterlinearLines = (): InterlinearLine[] => [
  {
    id: createPrefixedId("inter"),
    name: "word",
    description: "word in PRACTICE LANGUAGE",
    disappearing: "default",
    style: {},
  },
  {
    id: createPrefixedId("inter"),
    name: "ipa",
    description: "word pronunciation in IPA format",
    disappearing: "default",
    style: {},
  },
  {
    id: createPrefixedId("inter"),
    name: "pronunciation",
    description: "phonetic word pronunciation in HELP LANGUAGE",
    disappearing: "default",
    style: {},
  },
  {
    id: createPrefixedId("inter"),
    name: "lemma",
    description: "word in lemma form",
    disappearing: "default",
    style: {},
  },
  {
    id: createPrefixedId("inter"),
    name: "translation",
    description: "word translation in HELP LANGUAGE",
    disappearing: "default",
    style: {},
  },
  {
    id: createPrefixedId("inter"),
    name: "text",
    description:
      "whitespace delimeted text associated with word from the full sentence including capitalization and punctuatio",
    disappearing: "default",
    style: {},
  },
];

export const userSettings = pgTable("user_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("sett")),
  userId: text("user_id")
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  interlinearLines: jsonb("interlinear_lines")
    .$type<InterlinearLine[]>()
    .notNull()
    .$defaultFn(getDefaultInterlinearLines),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type UserSettingsInsert = typeof userSettings.$inferInsert;
