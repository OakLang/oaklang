import type { SpacedRepetitionStage } from "../types";

export const SPACED_REPETITION_STAGES: SpacedRepetitionStage[] = [
  {
    iteration: 1,
    waitTime: "0",
    repetitions: 5,
    timesToShowDisappearing: 3,
  },
  {
    iteration: 2,
    waitTime: "10m",
    repetitions: 5,
    timesToShowDisappearing: 3,
  },
  {
    iteration: 3,
    waitTime: "1d",
    repetitions: 4,
    timesToShowDisappearing: 1,
  },
  {
    iteration: 4,
    waitTime: "5d",
    repetitions: 6,
    timesToShowDisappearing: 1,
  },
];
