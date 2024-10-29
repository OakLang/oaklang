import { z } from "zod";

export const prompt = z.object({
  override: z.boolean(),
  prompt: z.string().min(1).max(2000),
});

export type Prompt = z.infer<typeof prompt>;

export const prompts = z.object({
  "interlinear-lines-for-sentence": prompt.nullish(),
  "exercise-1": prompt.nullish(),
  "exercise-2.list-of-words": prompt.nullish(),
  "exercise-2.number-of-words": prompt.nullish(),
  "exercise-2.number-of-sentences": prompt.nullish(),
  "exercise-3.ask-ai": prompt.nullish(),
  "exercise-3.content": prompt.nullish(),
});

export type Prompts = z.infer<typeof prompts>;
