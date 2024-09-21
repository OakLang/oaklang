import type { MotionValue } from "framer-motion";
import { useEffect } from "react";
import { animate, useMotionValue } from "framer-motion";

const inactiveShadow = "0px 0px 0px rgba(0,0,0,0)";

export function useRaisedShadow(value: MotionValue<number>) {
  const boxShadow = useMotionValue(inactiveShadow);

  useEffect(() => {
    let isActive = false;
    const onChange = (latest: number) => {
      const wasActive = isActive;
      if (latest !== 0) {
        isActive = true;
        if (isActive !== wasActive) {
          void animate(boxShadow, "0px 5px 16px rgba(0,0,0,0.1)");
        }
      } else {
        isActive = false;
        if (isActive !== wasActive) {
          void animate(boxShadow, inactiveShadow);
        }
      }
    };
    const unsub = value.on("change", onChange);
    return () => {
      unsub();
    };
  }, [value, boxShadow]);

  return boxShadow;
}
