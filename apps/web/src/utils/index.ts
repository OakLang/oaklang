import type { ClassValue } from "clsx";
import type { CSSProperties } from "react";
import { clsx } from "clsx";
import dayjs from "dayjs";
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
    lineHeight: 1,
    fontSize: line.style.fontSize,
    fontFamily: line.style.fontFamily,
    fontWeight: line.style.fontWeight,
    fontStyle: line.style.fontStyle,
    color: line.style.color ?? undefined,
  };
};

export const formatDate = (date: Date) => {
  return dayjs(date).format("MMM D, YYYY h:mm A");
};

export const camelCaseToWords = (s: string) => {
  const result = s.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};
