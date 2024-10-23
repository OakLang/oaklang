import { useEffect, useRef } from "react";

export const useIntersectionObserver = ({
  onIntersect,
}: {
  onIntersect: () => void;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const current = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin: "0px" },
    );

    current && observer.observe(current);

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [onIntersect]);

  return ref;
};
