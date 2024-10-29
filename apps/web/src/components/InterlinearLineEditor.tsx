import { useCallback, useMemo, useState } from "react";
import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import { EditIcon, EyeIcon, EyeOffIcon, TrashIcon } from "lucide-react";

import type { InterlinearLine } from "@acme/core/validators";
import { NON_EDITABLE_LINE_NAMES } from "@acme/core/constants";

import { useHasPowerUserAccess } from "~/hooks/useHasPowerUserAccess";
import { useRaisedShadow } from "~/hooks/useRaisedShadow";
import { cn, getCSSStyleForInterlinearLine } from "~/utils";
import { ReorderIcon } from "./icons/drag-icon";
import { InterlinearLineEditForm } from "./InterlinearLineEditForm";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function InterlinearLinesEditor({
  onChange,
  interlinearLines,
}: {
  interlinearLines: InterlinearLine[];
  onChange: (value: InterlinearLine[], debounce?: boolean) => void;
}) {
  return (
    <Reorder.Group values={interlinearLines} onReorder={onChange} axis="y">
      <div className="grid gap-4">
        {interlinearLines.map((item, i) => (
          <InterlinearLineRow
            item={item}
            onDelete={() =>
              onChange(interlinearLines.filter((_, index) => i !== index))
            }
            onChange={(newLine, debounce) =>
              onChange(
                interlinearLines.map((line, idx) =>
                  idx === i ? newLine : line,
                ),
                debounce,
              )
            }
            key={item.id}
            index={i}
          />
        ))}
      </div>
    </Reorder.Group>
  );
}

const InterlinearLineRow = ({
  item,
  onChange,
  onDelete,
  index,
}: {
  item: InterlinearLine;
  onChange: (line: InterlinearLine, debounce?: boolean) => void;
  onDelete: () => void;
  index: number;
}) => {
  const hasPowerUserAccess = useHasPowerUserAccess();

  const [isEditing, setIsEditing] = useState(false);
  const controls = useDragControls();
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);

  const disabled = useMemo(
    () => NON_EDITABLE_LINE_NAMES.includes(item.name),
    [item.name],
  );

  const onToggleHidden = useCallback(() => {
    onChange({ ...item, hidden: !item.hidden });
  }, [item, onChange]);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      style={{ boxShadow, y }}
      layout="position"
    >
      <div className="bg-card grid overflow-hidden rounded-lg border shadow-sm">
        <div className="flex h-14 items-center gap-2 px-2">
          <div
            onPointerDown={(event) => controls.start(event)}
            className="hover:bg-secondary flex h-8 w-6 cursor-grab items-center justify-center rounded-md"
          >
            <ReorderIcon className="h-4 w-4" />
          </div>

          <div className="flex flex-1 flex-col justify-center overflow-hidden">
            <p className="line-clamp-1 font-semibold leading-5">
              {item.name || `Line ${index + 1}`}{" "}
            </p>
            <p className="text-muted-foreground line-clamp-1 text-sm leading-4">
              {item.description}
            </p>
          </div>

          <div className="flex flex-shrink-0 space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className={cn("h-8 w-8", {
                    "bg-secondary": isEditing,
                  })}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <EditIcon className="h-4 w-4" />
                  <div className="sr-only">Edit Line</div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit line</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className={cn("h-8 w-8", {
                    "bg-secondary": item.hidden,
                  })}
                  onClick={onToggleHidden}
                >
                  {item.hidden ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {item.hidden ? "Show Line" : "Hide Line"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {item.hidden ? "Show Line" : "Hide Line"}
              </TooltipContent>
            </Tooltip>

            {hasPowerUserAccess && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    disabled={disabled}
                    onClick={onDelete}
                  >
                    <TrashIcon className="h-4 w-4" />
                    <div className="sr-only">Delete Line</div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Line</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {isEditing && (
          <div className="border-t">
            <InterlinearLineEditForm item={item} onChange={onChange} />
          </div>
        )}
        <div className="flex gap-2 overflow-hidden border-t p-2">
          <div
            className={cn(
              "w-full flex-1 overflow-x-auto rounded-md p-3 px-4 outline-none",
            )}
          >
            <p
              className="whitespace-nowrap leading-none"
              style={getCSSStyleForInterlinearLine(item)}
            >
              El gato es negro.
            </p>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
};
