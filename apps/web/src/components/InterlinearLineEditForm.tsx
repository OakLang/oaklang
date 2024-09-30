import type { ChangeEvent } from "react";
import { useCallback, useMemo } from "react";
import { useFormatter } from "next-intl";

import type {
  Disappearing,
  InterlinearLine,
  InterlinearLineActionType,
} from "@acme/core/validators";
import {
  FONTS,
  INTERLINEAR_LINE_DESCRIPTION_AVAILABLE_KEYS,
} from "@acme/core/constants";
import {
  InterlinearLineAction,
  NON_EDITABLE_LINE_NAMES,
} from "@acme/core/validators";

import { api } from "~/trpc/react";
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

interface ActionItem {
  value: string;
  name: string;
  requireLineName?: boolean;
}
const clickActions: ActionItem[] = [
  {
    value: InterlinearLineAction.inspectWord,
    name: "Inspect Word",
  },
  {
    value: InterlinearLineAction.markWordKnown,
    name: "Mark Word Known",
  },
  {
    value: InterlinearLineAction.markWordUnknown,
    name: "Mark Word Unknown",
  },
  {
    value: InterlinearLineAction.toggleMarkWordKnownOrUnknown,
    name: "Toggle Mark Word Known or Unknown",
  },
  {
    value: InterlinearLineAction.readoutFullSentence,
    name: "Readout Full Sentence",
  },
  {
    value: InterlinearLineAction.readoutLine,
    name: "Readout Line",
    requireLineName: true,
  },
  {
    value: InterlinearLineAction.hideLines,
    name: "Hide Lines",
  },
  {
    value: InterlinearLineAction.showLines,
    name: "Show Lines",
  },
  {
    value: InterlinearLineAction.toggleHideOrShowLines,
    name: "Toggle Hide or Show Lines",
  },
];

const hoverActions: ActionItem[] = [
  {
    value: InterlinearLineAction.showLineInTooltip,
    name: "Show Line in Tooltip",
    requireLineName: true,
  },
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
    <div className="grid gap-8 p-4">
      <div className="grid gap-4">
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
      </div>

      <div className="grid gap-4">
        <p className="font-semibold">Actions</p>
        <div className="grid gap-4">
          <ActionForm
            label="On Click"
            action={item.onClick ?? null}
            onChange={(action) => onChange({ ...item, onClick: action })}
            actions={clickActions}
          />
          <ActionForm
            label="On Double Click"
            action={item.onDoubleClick ?? null}
            onChange={(action) => onChange({ ...item, onDoubleClick: action })}
            actions={clickActions}
          />
          <ActionForm
            label="On Hover"
            action={item.onHover ?? null}
            onChange={(action) => onChange({ ...item, onHover: action })}
            actions={hoverActions}
          />
        </div>
      </div>

      <div className="grid gap-4">
        <p className="font-semibold">Styling</p>
        <div className="grid grid-cols-2 gap-4">
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
            <Label htmlFor={`interlinear-line-gpt-prompt`}>
              Font Size (px)
            </Label>
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
      </div>
    </div>
  );
};

const ActionForm = ({
  action,
  label,
  onChange,
  actions,
}: {
  label: string;
  action: InterlinearLineActionType | null;
  onChange: (action: InterlinearLineActionType | null) => void;
  actions: ActionItem[];
}) => {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const requireLineName = useMemo(
    () =>
      actions.find((item) => item.value === action?.action)?.requireLineName,
    [action?.action, actions],
  );

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid gap-4 rounded-md border p-4">
        <fieldset className="grid gap-2">
          <Label htmlFor="action">Action</Label>
          <SimpleSelect
            value={action?.action ?? "null"}
            options={[
              {
                value: "null",
                name: "No Action",
              },
              ...actions,
            ]}
            onValueChange={(value) =>
              onChange(
                value === "null" ? null : { ...(action ?? {}), action: value },
              )
            }
          />
        </fieldset>
        {action && requireLineName && (
          <fieldset className="grid gap-2">
            <Label htmlFor="action">Line Name</Label>
            <SimpleSelect
              value={action.lineName ?? undefined}
              options={
                userSettingsQuery.data?.interlinearLines.map((item) => ({
                  value: item.name,
                })) ?? []
              }
              onValueChange={(lineName) => onChange({ ...action, lineName })}
            />
          </fieldset>
        )}
      </div>
    </div>
  );
};
