import { z } from "zod";

import { COMPLEXITY_LIST } from "../constants";

export const moduleDataExercise1Schema = z.object({
  type: z.literal("exercise-1"),
  topic: z.string().nullish(),
  complexity: z.enum(COMPLEXITY_LIST).nullish(),
  words: z.array(z.string()).nullish(),
});
export const moduleDataExercise2Schema = z.object({
  type: z.literal("exercise-2"),
});

export const moduleDataSchema = z.union([
  moduleDataExercise1Schema,
  moduleDataExercise2Schema,
]);

export type ModuleData = z.infer<typeof moduleDataSchema>;
