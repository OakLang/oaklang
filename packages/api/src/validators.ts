import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { languages } from "@acme/db/schema";

export const languageWithStats = createSelectSchema(languages).and(
  z.object({
    knownWords: z.number(),
  }),
);

export type LanguageWithStats = z.infer<typeof languageWithStats>;
