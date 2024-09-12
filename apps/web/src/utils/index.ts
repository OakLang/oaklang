import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const swapArrayElement = <T>(
  array: T[],
  index: number,
  indexToSwapWith: number,
): T[] => {
  const newArray = [...array];
  const a = newArray[index];
  const b = newArray[indexToSwapWith];
  if (!a || !b) {
    return array;
  }
  newArray[indexToSwapWith] = a;
  newArray[index] = b;
  return newArray;
};
