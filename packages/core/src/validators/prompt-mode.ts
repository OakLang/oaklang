import { z } from "zod";

export const promptMode = z.object({
  id: z.string(),
  for: z.enum(["training-session"]),
  name: z.string().max(100),
  prompt: z.string().max(2000),
});
