export const APP_NAME = "Oaklang";

export const COMPLEXITY_LIST = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const INTERLINEAR_LINE_DESCRIPTION_AVAILABLE_KEYS = [
  "{PRACTICE_LANGUAGE}",
  "{NATIVE_LANGUAGE}",
];

export const AVAILABLE_PROMPT_TEMPLATE_KEYS = [
  "{PRACTICE_LANGUAGE}",
  "{NATIVE_LANGUAGE}",
  "{PRACTICE_WORDS}",
  "{KNOWN_WORDS}",
  "{PREVIOUSLY_GENERATED_SENTENCES}",
  "{SENTENCE_COUNT}",
  "{COMPLEXITY}",
];

export const TTS_SPEED_OPTIONS: number[] = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
];

export * from "./interlinear-lines";
export * from "./spaced-repetition-stages";
export * from "./prompt-modes";
