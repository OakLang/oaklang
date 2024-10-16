import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { trainingSessionsTable } from "./schema/training-session";

export const createTrainingSessionInput = createInsertSchema(
  trainingSessionsTable,
  {
    title: z.string().min(1).max(100),
    topic: z.string().min(1).max(400),
  },
)
  .pick({
    title: true,
    complexity: true,
    languageCode: true,
    topic: true,
    exercise: true,
  })
  .extend({
    words: z.array(z.string()).optional(),
  });
export type CreateTrainingSessionInput = z.infer<
  typeof createTrainingSessionInput
>;

export const updateTrainingSessionInput = createInsertSchema(
  trainingSessionsTable,
)
  .partial()
  .pick({
    title: true,
    complexity: true,
    sentenceIndex: true,
  });
export type UpdateTrainingSessionInput = z.infer<
  typeof updateTrainingSessionInput
>;
