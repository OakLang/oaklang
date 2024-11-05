import { Exercises } from "./exercise";
import { Exercise1 } from "./exercise-1";
import { Exercise2 } from "./exercise-2";
import { Exercise3 } from "./exercise-3";

export * from "./exercise";
export * from "./exercise-1";
export * from "./exercise-2";
export * from "./exercise-3";

export const ALL_EXERCISES = [Exercise1, Exercise2, Exercise3];

export const ALL_EXERCISE_IDS: string[] = [
  Exercises.exercise1,
  Exercises.exercise2,
  Exercises.exercise3,
];
export const INFINITE_EXERCISE_IDS: string[] = [Exercises.exercise1];
export const FINITE_EXERCISES_IDS: string[] = [
  Exercises.exercise2,
  Exercises.exercise3,
];
