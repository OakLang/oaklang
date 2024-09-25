import { z } from "zod";

export const spacedRepetitionStage = z.object({
  id: z.string(),
  iteration: z.number().min(1),
  waitTime: z.string(),
  repetitions: z.number().min(0),
  timesToShowDisappearing: z.number().min(0),
});

export type SpacedRepetitionStage = z.infer<typeof spacedRepetitionStage>;

export const DEFAULT_SPACED_REPETITION_STAGES: SpacedRepetitionStage[] = [
  {
    id: "01J8JCKTK8EH36035PXZ16901M",
    iteration: 1,
    waitTime: "0",
    repetitions: 5,
    timesToShowDisappearing: 3,
  },
  {
    id: "01J8JCMFQTDVAJ606MCDR9HJ6Y",
    iteration: 2,
    waitTime: "10m",
    repetitions: 5,
    timesToShowDisappearing: 3,
  },
  {
    id: "01J8JCMP8Q01WX9Z6N6SJQZEXC",
    iteration: 3,
    waitTime: "1d",
    repetitions: 4,
    timesToShowDisappearing: 1,
  },
  {
    id: "01J8JCMWB9HTBJJJ6R4ADS00MH",
    iteration: 4,
    waitTime: "5d",
    repetitions: 6,
    timesToShowDisappearing: 1,
  },
];
