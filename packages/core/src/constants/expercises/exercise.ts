export const Exercises = {
  exercise1: "exercise-1",
  exercise2: "exercise-2",
  exercise3: "exercise-3",
} as const;

const _exercise_ids = Object.values(Exercises);

export interface Exercise {
  id: (typeof _exercise_ids)[number];
  name: string;
  description?: string | null;
  [x: string]: unknown;
}
