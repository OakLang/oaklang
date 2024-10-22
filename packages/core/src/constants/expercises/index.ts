import { Exercises } from "./exercise";
import { EXERCISE_1 } from "./exercise-1";
import { EXERCISE_2 } from "./exercise-2";
import { EXERCISE_3 } from "./exercise-3";

export * from "./exercise";
export * from "./exercise-1";
export * from "./exercise-2";
export * from "./exercise-3";

export const EXERCISES = [EXERCISE_1, EXERCISE_2, EXERCISE_3];

export const INFINITE_EXERCISES: string[] = [Exercises.exercise1];

export const FINITE_EXERCISES: string[] = [
  Exercises.exercise2,
  Exercises.exercise3,
];
