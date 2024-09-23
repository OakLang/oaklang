import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import { EditIcon, EyeIcon, EyeOffIcon, TrashIcon } from "lucide-react";

import type { Disappearing, InterlinearLine } from "@acme/core/validators";

import { useRaisedShadow } from "~/hooks/useRaisedShadow";
import { cn, getCSSStyleForInterlinearLine } from "~/utils";
import { ReorderIcon } from "./icons/drag-icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const disappearingOptions: {
  value: Disappearing;
  name: string;
}[] = [
  {
    value: "default",
    name: "Default",
  },
  {
    value: "sticky",
    name: "Sticky",
  },
];

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
  onDelete: () => void;
  onChange: (line: InterlinearLine) => void;
  index: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const controls = useDragControls();
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);

  const disabled = item.name === "word";

  const onChangeName = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...item, name: e.currentTarget.value });
    },
    [item, onChange],
  );

  const onChangeDescription = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ ...item, description: e.currentTarget.value });
    },
    [item, onChange],
  );
  const onChangeDisappearing = useCallback(
    (disappearing: Disappearing) => {
      onChange({ ...item, disappearing });
    },
    [item, onChange],
  );
  const onToggleHidden = useCallback(() => {
    onChange({ ...item, hidden: !item.hidden });
  }, [item, onChange]);

  const onChangeStyle = useCallback(
    (style: Partial<NonNullable<InterlinearLine["style"]>>) => {
      onChange({
        ...item,
        style: {
          ...item.style,
          ...style,
        },
      });
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
      <div className="flex h-14 items-center gap-2 border-b px-2">
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
                  "bg-secondary": isEditing,
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
      <div
        className={cn("hidden grid-cols-2 gap-4 p-4", {
          grid: isEditing,
        })}
      >
        <fieldset className="col-span-full grid gap-1">
          <Label htmlFor={`interlinear-line-name`}>Name</Label>
          <Input
            id={`interlinear-line-name`}
            value={item.name}
            disabled={disabled}
            onChange={(e) => onChangeName(e)}
          />
        </fieldset>

        <fieldset className="col-span-full grid gap-1">
          <Label htmlFor={`interlinear-line-gpt-prompt`}>Description</Label>
          <Textarea
            value={item.description}
            rows={2}
            className="min-h-0 resize-none"
            onChange={(e) => onChangeDescription(e)}
          />
        </fieldset>

        <fieldset className="col-span-full flex items-center justify-between">
          <Label htmlFor="enabled">Disappearing</Label>
          <Tabs value={item.disappearing}>
            <TabsList>
              {disappearingOptions.map((item) => (
                <TabsTrigger
                  value={item.value}
                  key={item.value}
                  onClick={() => onChangeDisappearing(item.value)}
                >
                  {item.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </fieldset>

        <fieldset className="grid gap-1">
          <Label htmlFor={`interlinear-line-gpt-prompt`}>Font Family</Label>
          <Input
            value={item.style.fontFamily ?? ""}
            placeholder="Times New Roman"
            className="min-h-0 resize-none"
            onChange={(e) =>
              onChangeStyle({ fontFamily: e.currentTarget.value })
            }
          />
        </fieldset>

        <fieldset className="grid gap-1">
          <Label htmlFor={`interlinear-line-gpt-prompt`}>Font Weight</Label>
          <Input
            value={item.style.fontWeight ?? ""}
            placeholder="600"
            className="min-h-0 resize-none"
            onChange={(e) =>
              onChangeStyle({ fontWeight: e.currentTarget.value })
            }
          />
        </fieldset>

        <fieldset className="grid gap-1">
          <Label htmlFor={`interlinear-line-gpt-prompt`}>Font Style</Label>
          <Input
            value={item.style.fontStyle ?? ""}
            placeholder="italic"
            className="min-h-0 resize-none"
            onChange={(e) =>
              onChangeStyle({ fontStyle: e.currentTarget.value })
            }
          />
        </fieldset>

        <fieldset className="grid gap-1">
          <Label htmlFor={`interlinear-line-gpt-prompt`}>Text Color</Label>
          <Input
            value={item.style.color ?? ""}
            placeholder="#000000"
            className="min-h-0 resize-none"
            onChange={(e) => onChangeStyle({ color: e.currentTarget.value })}
          />
        </fieldset>
      </div>
      <div
        className="bg-secondary/50 grid gap-2 overflow-x-auto px-4 py-2 outline-none"
        style={getCSSStyleForInterlinearLine(item)}
        contentEditable
      >
        El gato es negro.
      </div>
    </Reorder.Item>
  );
};
