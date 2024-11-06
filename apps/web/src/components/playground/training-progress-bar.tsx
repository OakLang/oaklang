import { useMemo } from "react";

import type { Sentence } from "@acme/db/schema";

import { cn } from "~/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const maxIndicatorsToShow = 9;

export default function TrainingProgressBar({
  sentences,
  currentPage,
  onPageChange,
  className,
}: {
  sentences: Sentence[];
  currentPage: number;
  onPageChange: (index: number) => void;
  className?: string;
  tooltipText?: string;
}) {
  const start = useMemo(() => {
    if (sentences.length < maxIndicatorsToShow) {
      return 0;
    }
    return Math.max(currentPage - Math.floor(maxIndicatorsToShow / 2), 0);
  }, [currentPage, sentences.length]);

  const end = useMemo(() => {
    return Math.min(start + maxIndicatorsToShow, sentences.length);
  }, [sentences.length, start]);

  return (
    <div className={cn("flex h-2 w-full items-center gap-1", className)}>
      {sentences[start - 1] && (
        <div
          className={cn("bg-secondary/50 h-full flex-1 rounded-full", {
            "bg-primary/50": !!sentences[start - 1]?.completedAt,
          })}
        />
      )}
      {sentences.slice(start, end).map((item, i) => {
        const index = start + i;
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "h-full rounded-full transition-all",
                  item.completedAt
                    ? "bg-primary/50 hover:bg-primary"
                    : "bg-secondary/50 hover:bg-secondary",
                  index === currentPage ? "bg-primary flex-[5]" : "flex-[3]",
                )}
                disabled={!item.completedAt}
                onClick={() => {
                  onPageChange(index);
                }}
              />
            </TooltipTrigger>
            <TooltipContent align="center" side="top">
              {index + 1}/{sentences.length}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {sentences[end] && (
        <div
          className={cn("bg-secondary/50 h-full flex-1 rounded-full", {
            "bg-primary/50": !!sentences[end]?.completedAt,
          })}
        />
      )}
    </div>
  );
}
