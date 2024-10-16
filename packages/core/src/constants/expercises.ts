export const Exercises = {
  exercies1: "exercise-1",
  exercies2: "exercise-2",
  exercies3: "exercise-3",
} as const;

export interface Exercise {
  id: string;
  name: string;
  description?: string | null;
  [x: string]: unknown;
}

export const EXERCISE_1 = {
  id: Exercises.exercies1,
  name: "Infinite Sentence Practice",
} satisfies Exercise;

export const EXERCISE_2 = {
  id: Exercises.exercies2,
  name: "Session Sentence Practice",
} satisfies Exercise;

export const EXERCISE_3 = {
  id: Exercises.exercies3,
  name: "Content Practice",
} satisfies Exercise;

export const EXERCISES: Exercise[] = [EXERCISE_1, EXERCISE_2, EXERCISE_3];
