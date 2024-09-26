import { useCallback, useMemo, useState } from "react";
import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import {
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  MoonIcon,
  SunIcon,
  TrashIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import type { InterlinearLine } from "@acme/core/validators";
import { NON_EDITABLE_LINE_NAMES } from "@acme/core/validators";

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
  onChange: (value: InterlinearLine[]) => void;
}) {
  return (
    <Reorder.Group
      className="grid gap-4"
      values={interlinearLines}
      onReorder={onChange}
      axis="y"
    >
      {interlinearLines.map((item, i) => (
        <InterlinearLineRow
          item={item}
          onDelete={() =>
            onChange(interlinearLines.filter((_, index) => i !== index))
          }
          onChange={(newLine) =>
            onChange(
              interlinearLines.map((line, idx) => (idx === i ? newLine : line)),
            )
          }
          key={item.id}
          index={i}
        />
      ))}
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
  onChange: (line: InterlinearLine) => void;
  onDelete: () => void;
  index: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const controls = useDragControls();
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const { resolvedTheme } = useTheme();
  const [dark, setDark] = useState(resolvedTheme === "dark");

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
      className="bg-card grid overflow-hidden rounded-lg border shadow-sm"
      style={{ boxShadow, y }}
      layout="position"
    >
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
        </div>
      </div>
      {isEditing && (
        <div className="border-t">
          <InterlinearLineEditForm item={item} onChange={onChange} />
        </div>
      )}
      <div className="flex gap-2 overflow-hidden border-t p-2">
        <div
          contentEditable
          className={cn(
            "w-full flex-1 overflow-x-auto rounded-md p-3 px-4 outline-none",
            {
              "bg-zinc-900 text-white": dark,
              "bg-zinc-100 text-zinc-950": !dark,
            },
          )}
        >
          <p
            className="whitespace-nowrap leading-none"
            style={getCSSStyleForInterlinearLine(item)}
          >
            El gato es negro.
          </p>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="h-full w-8 flex-shrink-0"
          onClick={() => setDark(!dark)}
        >
          {dark ? (
            <MoonIcon className="h-4 w-4" />
          ) : (
            <SunIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Reorder.Item>
  );
};
