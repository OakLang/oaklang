import { z } from "zod";

import { COMPLEXITY_LIST, Exercises } from "@acme/core/constants";

export const exercise1Data = z.object({
  topic: z.string().min(1, "Topic is required").max(1000),
  complexity: z.enum(COMPLEXITY_LIST),
  words: z.array(z.string()).optional(),
});

export const exercise1Schema = z.object({
  exercise: z.literal(Exercises.exercise1),
  data: exercise1Data,
});

export type Exercise1FormData = z.infer<typeof exercise1Schema>;

export const exercise2Data = z.discriminatedUnion("learnFrom", [
  z.object({
    learnFrom: z.literal("list-of-words"),
    words: z.array(z.string()).min(1, "Minimum 1 words required").max(50),
    eachWordPracticeCount: z.number().min(1).max(10),
    complexity: z.enum(COMPLEXITY_LIST),
  }),
  z.object({
    learnFrom: z.literal("number-of-words"),
    numberOfWords: z
      .number({ message: "Number of words required" })
      .int()
      .min(1)
      .max(50),
    eachWordPracticeCount: z.number().min(1).max(10),
    topic: z.string().min(1, "Topic is required").max(1000),
    complexity: z.enum(COMPLEXITY_LIST),
  }),
  z.object({
    learnFrom: z.literal("number-of-sentences"),
    numberOfSentences: z
      .number({ message: "Number of sentences required" })
      .int()
      .min(1)
      .max(50),
    topic: z.string().min(1, "Topic is required").max(1000),
    complexity: z.enum(COMPLEXITY_LIST),
  }),
]);

export const exercise2Schema = z.object({
  exercise: z.literal(Exercises.exercise2),
  data: exercise2Data,
});

export type Exercise2FormData = z.infer<typeof exercise2Schema>;

export const exercise3Data = z.discriminatedUnion("learnFrom", [
  z.object({
    learnFrom: z.literal("content"),
    content: z.string().min(1).max(10000),
  }),
  z.object({
    learnFrom: z.literal("ask-ai"),
    topic: z.string().min(1).max(1000),
    complexity: z.enum(COMPLEXITY_LIST),
  }),
]);

export const exercise3Schema = z.object({
  exercise: z.literal(Exercises.exercise3),
  data: exercise3Data,
});

export type Exercise3FormData = z.infer<typeof exercise3Schema>;

export const exerciseSchema = z.discriminatedUnion("exercise", [
  exercise1Schema,
  exercise2Schema,
  exercise3Schema,
]);

export type ExerciseFormData = z.infer<typeof exerciseSchema>;

export const createTrainingSessionSchema = z.object({
  title: z.string().min(1, "title required"),
  languageCode: z.string().min(1, "languageCode required"),
  exercise: exerciseSchema,
});

export type CreateTrainingSessoin = z.infer<typeof createTrainingSessionSchema>;
