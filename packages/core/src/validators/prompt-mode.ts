import { z } from "zod";

export const promptModeSchema = z.object({
  id: z.string(),
  for: z.enum(["training-session"]),
  name: z.string().max(100),
  prompt: z.string().max(2000),
});

export type PromptMode = z.infer<typeof promptModeSchema>;
