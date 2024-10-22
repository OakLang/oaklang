import { useMemo } from "react";

import { cn } from "~/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const maxIndicatorsToShow = 9;

export default function TrainingProgressBar({
  pages,
  currentPage,
  onPageChange,
  className,
}: {
  pages: {
    index: number;
    completed: boolean;
  }[];
  currentPage: number;
  onPageChange: (index: number) => void;
  className?: string;
  tooltipText?: string;
}) {
  const start = useMemo(() => {
    if (pages.length < maxIndicatorsToShow) {
      return 0;
    }
    return Math.max(currentPage - Math.floor(maxIndicatorsToShow / 2), 0);
  }, [currentPage, pages.length]);

  const end = useMemo(() => {
    return start + maxIndicatorsToShow;
  }, [start]);

  console.log({ start, end });

  return (
    <div className={cn("flex h-2 w-full items-center gap-1", className)}>
      {pages[start - 1] && (
        <div
          className={cn("bg-secondary/50 h-full flex-1 rounded-full", {
            "bg-primary/50": pages[start - 1]?.completed,
          })}
        />
      )}
      {pages.slice(start, end).map((item) => (
        <Tooltip key={item.index}>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "h-full rounded-full transition-all",
                item.completed
                  ? "bg-primary/50 hover:bg-primary"
                  : "bg-secondary/50 hover:bg-secondary",
                item.index === currentPage ? "bg-primary flex-[5]" : "flex-[3]",
              )}
              disabled={!item.completed}
              onClick={() => {
                onPageChange(item.index);
              }}
            />
          </TooltipTrigger>
          <TooltipContent align="center" side="top">
            {item.index + 1}/{pages.length}
          </TooltipContent>
        </Tooltip>
      ))}
      {pages[end] && (
        <div
          className={cn("bg-secondary/50 h-full flex-1 rounded-full", {
            "bg-primary/50": pages[end]?.completed,
          })}
        />
      )}
    </div>
  );
}
