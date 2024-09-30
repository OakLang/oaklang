import type { ButtonHTMLAttributes } from "react";
import { useCallback, useRef } from "react";

export const useDoubleClick = ({
  onClick,
  onDoubleClick,
  delay = 200,
}: {
  onClick?: () => void;
  onDoubleClick?: () => void;
  delay?: number;
}) => {
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const prevented = useRef(false);

  const handleOnClick = useCallback(() => {
    timeout.current = setTimeout(() => {
      if (!prevented.current) {
        onClick?.();
      }
      prevented.current = false;
    }, delay);
  }, [delay, onClick]);

  const handleOnDoubleClick = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    prevented.current = true;
    onDoubleClick?.();
  }, [onDoubleClick]);

  return {
    onClick: handleOnClick,
    onDoubleClick: handleOnDoubleClick,
  } satisfies ButtonHTMLAttributes<HTMLButtonElement>;
};
