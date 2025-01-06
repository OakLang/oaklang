import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";

export const usePersistState = <T = undefined>(
  key: string,
  initialState: T,
): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    if (typeof window !== "undefined") {
      const stateStr = localStorage.getItem(key);
      if (stateStr) {
        return JSON.parse(stateStr) as unknown as T;
      } else {
        return initialState;
      }
    } else {
      return initialState;
    }
  });

  const handleSetState: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      setState((prevState) => {
        if (typeof value === "function") {
          const newValue = (value as (prevState: T) => T)(prevState);
          localStorage.setItem(key, JSON.stringify(newValue));
          return newValue;
        } else {
          localStorage.setItem(key, JSON.stringify(value));
          return value;
        }
      });
    },
    [key],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stateStr = localStorage.getItem(key);
      if (stateStr) {
        setState(JSON.parse(stateStr) as unknown as T);
      }
    }
  }, [key]);

  return [state, handleSetState];
};
