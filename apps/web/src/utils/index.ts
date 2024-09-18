import type { ClassValue } from "clsx";
import type { CSSProperties } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { InterlinearLine } from "@acme/core/validators";

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

export const getCSSStyleForInterlinearLine = (
  line: InterlinearLine,
): CSSProperties => {
  return {
    fontSize: line.style.fontSize ?? undefined,
    fontFamily: line.style.fontFamily ?? undefined,
    fontWeight: line.style.fontWeight ?? undefined,
    fontStyle: line.style.fontStyle ?? undefined,
    color: line.style.color ?? undefined,
  };
};
