import { z } from "zod";

import { COMPLEXITY_LIST, Exercises } from "@acme/core/constants";

const baseSchema = z.object({
  title: z.string().min(1, "title required"),
  languageCode: z.string().min(1, "languageCode required"),
});

export const exercise1Schema = z.object({
  exercise: z.literal(Exercises.exercies1),
  data: z.object({
    topic: z.string().min(1, "Topic is required").max(300),
    complexity: z.enum(COMPLEXITY_LIST),
    words: z.array(z.string()).optional(),
  }),
});

export type Exercise1FormData = z.infer<typeof exercise1Schema>;

export const exercise2Schema = z.object({
  exercise: z.literal(Exercises.exercies2),
  data: z.discriminatedUnion("learnFrom", [
    z.object({
      learnFrom: z.literal("list-of-words"),
      words: z.array(z.string()).min(1, "Minimum 1 words required").max(50),
    }),
    z.object({
      learnFrom: z.literal("number-of-words"),
      numberOfWords: z
        .number({ message: "Number of words required" })
        .int()
        .min(1)
        .max(50),
    }),
    z.object({
      learnFrom: z.literal("number-of-sentences"),
      numberOfSentences: z
        .number({ message: "Number of sentences required" })
        .int()
        .min(1)
        .max(50),
    }),
  ]),
});

export type Exercise2FormData = z.infer<typeof exercise2Schema>;

export const exercise3Schema = z.object({
  exercise: z.literal(Exercises.exercies3),
  data: z.discriminatedUnion("learnFrom", [
    z.object({
      learnFrom: z.literal("content"),
      content: z.string().min(1).max(1000),
    }),
    z.object({
      learnFrom: z.literal("ask-ai"),
      topic: z.string().min(1).max(300),
    }),
  ]),
});

export type Exercise3FormData = z.infer<typeof exercise3Schema>;

export const createTrainingSessionSchema = z
  .discriminatedUnion("exercise", [
    exercise1Schema,
    exercise2Schema,
    exercise3Schema,
  ])
  .and(baseSchema);

export type CreateTrainingSessoin = z.infer<typeof createTrainingSessionSchema>;
