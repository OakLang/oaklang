import { z } from 'zod';

export const createTrainingSessionInput = z.object({
  language: z.string().min(1).max(100),
  numberOfTimesToRepeat: z.number().min(0),
  numberOfTimesToTrain: z.number().min(0),
  numberOfWordsToTrain: z.number().min(0),
  percentKnown: z.number().min(0).max(100),
  relatedPrecursor: z.boolean(),
  sentenceLength: z.number().nullish(),
});
export type CreateTrainingSessionInput = z.infer<typeof createTrainingSessionInput>;

export const updateTrainingSessionInput = createTrainingSessionInput.partial().extend({
  id: z.string().uuid(),
});
export type UpdateTrainingSessionInput = z.infer<typeof updateTrainingSessionInput>;
