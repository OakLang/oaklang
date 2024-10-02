import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { trainingSessions } from "./schema/training-session";

export const createTrainingSessionInput = createInsertSchema(trainingSessions, {
  title: z.string().min(1).max(100),
  topic: z.string().min(30).max(400),
}).pick({
  title: true,
  complexity: true,
  languageCode: true,
  topic: true,
});
export type CreateTrainingSessionInput = z.infer<
  typeof createTrainingSessionInput
>;

export const updateTrainingSessionInput = createInsertSchema(trainingSessions)
  .partial()
  .pick({
    title: true,
    complexity: true,
    sentenceIndex: true,
  });
export type UpdateTrainingSessionInput = z.infer<
  typeof updateTrainingSessionInput
>;
