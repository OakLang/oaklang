import type { RefObject } from "react";
import { useEffect, useMemo, useState } from "react";

export default function useOnScreen(ref: RefObject<HTMLElement | null>) {
  const [isIntersecting, setIntersecting] = useState(false);

  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) =>
        setIntersecting(entry?.isIntersecting ?? false),
      ),
    [],
  );

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [observer, ref]);

  return isIntersecting;
}
