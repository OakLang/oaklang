import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import type { InterlinearLine } from "@acme/core/types";

import { createPrefixedId } from "../utils";
import { users } from "./auth";

export const getDefaultInterlinearLines = (): InterlinearLine[] => [
  {
    id: createPrefixedId("inter"),
    gptPrompt:
      "whitespace delimeted text associated with word from the full sentence including capitalization and punctuatio",
    name: "Leading text",
    enabled: true,
    style: {},
  },
  {
    id: createPrefixedId("inter"),
    gptPrompt:
      "whitespace delimeted text associated with word from the full sentence including capitalization and punctuatio",
    name: "Leading text",
    enabled: true,
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
