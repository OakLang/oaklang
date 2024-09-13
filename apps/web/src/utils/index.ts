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
  style: InterlinearLine["style"],
): CSSProperties => {
  return {
    fontSize: style.fontSize ?? undefined,
    fontFamily: style.fontFamily ?? undefined,
    fontWeight: style.fontWeight ?? undefined,
    fontStyle: style.fontStyle ?? undefined,
    color: style.color ?? undefined,
  };
};
