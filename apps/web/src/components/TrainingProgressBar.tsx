import { cn } from "~/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

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
  return (
    <div className={cn("flex h-2 w-full items-center gap-1", className)}>
      {pages.map((item) => (
        <Tooltip key={item.index}>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "h-full rounded-full transition-all",
                item.completed
                  ? "bg-primary/50 hover:bg-primary"
                  : "bg-secondary/50 hover:bg-secondary",
                item.index === currentPage ? "bg-primary flex-[2]" : "flex-1",
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
    </div>
  );
}
