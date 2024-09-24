import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import { EditIcon, TrashIcon } from "lucide-react";

import type { SpacedRepetitionStage } from "@acme/core/validators";

import { useRaisedShadow } from "~/hooks/useRaisedShadow";
import { cn } from "~/utils";
import { ReorderIcon } from "./icons/drag-icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function SpacedRepetitionStagesEditor({
  onChange,
  items,
}: {
  items: SpacedRepetitionStage[];
  onChange: (value: SpacedRepetitionStage[]) => void;
}) {
  const fixIterationAndChange = useCallback(
    (items: SpacedRepetitionStage[]) => {
      const newItems = items.map(
        (item, i) =>
          ({ ...item, iteration: i + 1 }) satisfies SpacedRepetitionStage,
      );
      onChange(newItems);
    },
    [onChange],
  );

  return (
    <Reorder.Group
      className="grid gap-4"
      values={items}
      onReorder={fixIterationAndChange}
      axis="y"
    >
      {items.map((item, i) => (
        <SpacedRepetitionStageRow
          item={item}
          onDelete={() =>
            fixIterationAndChange(items.filter((_, index) => i !== index))
          }
          onChange={(newLine) =>
            onChange(items.map((line, idx) => (idx === i ? newLine : line)))
          }
          key={item.id}
        />
      ))}
    </Reorder.Group>
  );
}

const SpacedRepetitionStageRow = ({
  item,
  onChange,
  onDelete,
}: {
  item: SpacedRepetitionStage;
  onDelete: () => void;
  onChange: (line: SpacedRepetitionStage) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const controls = useDragControls();

  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);

  const onChangeWaitTime = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...item, waitTime: e.currentTarget.value });
    },
    [item, onChange],
  );
  const onChangeRepetitions = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      try {
        const repetitions = parseInt(e.currentTarget.value);
        onChange({ ...item, repetitions });
      } catch (error) {
        console.log(error);
      }
    },
    [item, onChange],
  );
  const onChangeTimesToShowDisappearing = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      try {
        const timesToShowDisappearing = parseInt(e.currentTarget.value);
        onChange({ ...item, timesToShowDisappearing });
      } catch (error) {
        console.log(error);
      }
    },
    [item, onChange],
  );

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="bg-card grid rounded-lg border shadow-sm"
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
            Iteration: {item.iteration}
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
                <div className="sr-only">Edit Stage</div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Stage</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
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
        <div className="grid gap-6 border-t p-4">
          <fieldset className="col-span-full grid gap-2">
            <Label htmlFor="wait-time">Wait Time</Label>
            <Input
              id="wait-time"
              value={item.waitTime}
              onChange={(e) => onChangeWaitTime(e)}
              placeholder="1d, 2 days, 1y, 10m, 32 minutes, ..."
            />
          </fieldset>

          <fieldset className="col-span-full grid gap-2">
            <Label htmlFor="repetitions">Repetitions</Label>
            <Input
              id="repetitions"
              type="number"
              value={item.repetitions}
              min={1}
              onChange={(e) => onChangeRepetitions(e)}
            />
          </fieldset>

          <fieldset className="col-span-full grid gap-2">
            <Label htmlFor="repetitions">Times To Show Disappearing</Label>
            <Input
              id="repetitions"
              value={item.timesToShowDisappearing}
              type="number"
              min={0}
              onChange={(e) => onChangeTimesToShowDisappearing(e)}
            />
          </fieldset>
        </div>
      )}
    </Reorder.Item>
  );
};
