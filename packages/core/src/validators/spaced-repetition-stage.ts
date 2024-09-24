import { z } from "zod";

export const spacedRepetitionStage = z.object({
  id: z.string(),
  iteration: z.number().min(1),
  waitTime: z.string(),
  repetitions: z.number().min(0),
  timesToShowDisappearing: z.number().min(0),
});

export type SpacedRepetitionStage = z.infer<typeof spacedRepetitionStage>;
