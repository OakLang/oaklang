import type { ChangeEvent } from "react";
import { useCallback, useMemo } from "react";
import { useFormatter } from "next-intl";

import type { Disappearing, InterlinearLine } from "@acme/core/validators";
import {
  FONTS,
  INTERLINEAR_LINE_DESCRIPTION_AVAILABLE_KEYS,
} from "@acme/core/constants";
import { NON_EDITABLE_LINE_NAMES } from "@acme/core/validators";

import SimpleSelect from "./simple-select";
import ColorPicker from "./ui/color-picker";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import NumberInput from "./ui/number-input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

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

const fontWeightOptions = [
  { value: "100" },
  { value: "200" },
  { value: "300" },
  { value: "400" },
  { value: "500" },
  { value: "600" },
  { value: "700" },
  { value: "800" },
  { value: "900" },
];

const fontStyleOptions = [
  { value: "normal" },
  { value: "italic" },
  { value: "oblique" },
];

export const InterlinearLineEditForm = ({
  item,
  onChange,
}: {
  item: InterlinearLine;
  onChange: (line: InterlinearLine) => void;
}) => {
  const format = useFormatter();

  const disabled = useMemo(
    () => NON_EDITABLE_LINE_NAMES.includes(item.name),
    [item.name],
  );

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
    <div className="grid grid-cols-2 gap-6 p-4">
      <fieldset className="col-span-full grid gap-2">
        <Label htmlFor={`interlinear-line-name`}>Name</Label>
        <Input
          id={`interlinear-line-name`}
          value={item.name}
          disabled={disabled}
          onChange={(e) => onChangeName(e)}
        />
      </fieldset>

      <fieldset className="col-span-full grid gap-2">
        <Label htmlFor={`interlinear-line-gpt-prompt`}>Description</Label>
        <Textarea
          value={item.description}
          rows={2}
          className="min-h-0 resize-none"
          onChange={(e) => onChangeDescription(e)}
        />
        <p className="text-muted-foreground text-sm">
          Available keys{" "}
          {format.list(
            INTERLINEAR_LINE_DESCRIPTION_AVAILABLE_KEYS.map((key) => (
              <code key={key} className="font-semibold">
                {key}
              </code>
            )),
          )}
        </p>
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

      <fieldset className="grid gap-2">
        <Label htmlFor={`interlinear-line-gpt-prompt`}>Font Family</Label>
        <SimpleSelect
          options={FONTS.map((font) => ({ value: font }))}
          value={item.style.fontFamily}
          onValueChange={(fontFamily) => onChangeStyle({ fontFamily })}
        />
      </fieldset>

      <fieldset className="grid gap-2">
        <Label htmlFor={`interlinear-line-gpt-prompt`}>Font Weight</Label>
        <SimpleSelect
          options={fontWeightOptions}
          value={item.style.fontWeight}
          onValueChange={(fontWeight) => onChangeStyle({ fontWeight })}
        />
      </fieldset>

      <fieldset className="grid gap-2">
        <Label htmlFor={`interlinear-line-gpt-prompt`}>Font Style</Label>
        <SimpleSelect
          options={fontStyleOptions}
          value={item.style.fontStyle}
          onValueChange={(fontStyle) => onChangeStyle({ fontStyle })}
        />
      </fieldset>

      <fieldset className="grid gap-2">
        <Label htmlFor={`interlinear-line-gpt-prompt`}>Font Size (px)</Label>
        <NumberInput
          value={item.style.fontSize}
          onChange={(fontSize) => onChangeStyle({ fontSize })}
          minValue={12}
          maxValue={48}
        />
      </fieldset>

      <fieldset className="grid gap-2">
        <Label htmlFor={`interlinear-line-gpt-prompt`}>Text Color</Label>
        <ColorPicker
          className="min-h-0 resize-none"
          defaultValue={item.style.color ?? undefined}
          onChange={(color) => onChangeStyle({ color: color.toString() })}
          onRemoveColor={() => onChangeStyle({ color: null })}
        />
      </fieldset>
    </div>
  );
};
