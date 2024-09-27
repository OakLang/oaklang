import { useCallback, useEffect, useState } from "react";

export const usePersistState = <T = undefined>(
  key: string,
  initialState: T,
): [T, (newState: T) => void] => {
  const [state, _setState] = useState(initialState);

  const setState = useCallback(
    (newState: T) => {
      _setState(newState);
      localStorage.setItem(key, JSON.stringify(newState));
    },
    [key],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stateStr = localStorage.getItem(key);
      if (stateStr) {
        _setState(JSON.parse(stateStr) as unknown as T);
      }
    }
  }, [key]);

  return [state, setState];
};
