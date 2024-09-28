"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import {
  ArrowLeftIcon,
  BookAIcon,
  EyeIcon,
  EyeOffIcon,
  SidebarCloseIcon,
  SidebarOpenIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import type { InterlinearLine } from "@acme/core/validators";

import { ReorderIcon } from "~/components/icons/drag-icon";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { useRaisedShadow } from "~/hooks/useRaisedShadow";
import { useTrainingSessionId } from "~/hooks/useTrainingSessionId";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { Link } from "~/i18n/routing";
import { useAppStore } from "~/providers/app-store-provider";
import { api } from "~/trpc/react";
import { cn } from "~/utils";

export default function TopBar() {
  const trainingSessionId = useTrainingSessionId();
  const practiceLanguage = usePracticeLanguageCode();
  const trainingSessionQuery =
    api.trainingSessions.getTrainingSession.useQuery(trainingSessionId);

  const inspectionPanelOpen = useAppStore((state) => state.inspectionPanelOpen);
  const setInspectionPanelOpen = useAppStore(
    (state) => state.setInspectionPanelOpen,
  );
  const fontSize = useAppStore((state) => state.fontSize);
  const setFontSize = useAppStore((state) => state.setFontSize);
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex flex-shrink-0 items-center p-2">
      <div className="flex flex-1 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2" asChild>
              <Link href={`/app/${practiceLanguage}`}>
                <ArrowLeftIcon className="h-5 w-5" />
                <div className="sr-only">Back</div>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>

        <h1 className="text-lg font-medium">
          {trainingSessionQuery.data?.title}
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost">
                  <BookAIcon className="h-5 w-5" />
                  <div className="sr-only">Reader Settings</div>
                </Button>
              </TooltipTrigger>
            </PopoverTrigger>
            <PopoverContent
              className="max-h-[calc(100vh-10rem)] w-96 overflow-y-auto p-0"
              side="bottom"
              align="end"
            >
              <div className="p-4 pb-0">
                <h2 className="text-lg font-semibold">Reader Settings</h2>
              </div>

              <div className="space-y-6 p-4">
                <div className="flex items-center">
                  <Label htmlFor="theme-picker" className="flex-1">
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme-picker" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { value: "light", name: "Light" },
                        { value: "dark", name: "Dark" },
                        { value: "system", name: "System" },
                      ].map((item) => (
                        <SelectItem value={item.value} key={item.value}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="font-size">Font Size</Label>
                    <p className="text-muted-foreground text-sm">
                      {fontSize}px
                    </p>
                  </div>
                  <Slider
                    id="font-size"
                    defaultValue={[fontSize]}
                    min={12}
                    max={24}
                    step={2}
                    onValueChange={(values) => setFontSize(values[0] ?? 16)}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Interlinear Lines</p>
                    <Link
                      href={`/app/${practiceLanguage}/settings/reader#interlinear-lines`}
                      className="text-muted-foreground hover:text-foreground text-sm font-medium underline"
                    >
                      Edit
                    </Link>
                  </div>
                  <div>
                    <SimpleInterlinearLineEditor />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <TooltipContent>Reader Settings</TooltipContent>
        </Tooltip>

        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontalIcon className="h-5 w-5 rotate-180" />
              <div className="sr-only">Options</div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Options</TooltipContent>
        </Tooltip> */}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setInspectionPanelOpen(!inspectionPanelOpen)}
            >
              {inspectionPanelOpen ? (
                <SidebarCloseIcon className="h-5 w-5 rotate-180" />
              ) : (
                <SidebarOpenIcon className="h-5 w-5 rotate-180" />
              )}
              <div className="sr-only">
                {inspectionPanelOpen ? "Colapse Sidebar" : "Expand sidebar"}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {inspectionPanelOpen ? "Colapse Sidebar" : "Expand sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

const SimpleInterlinearLineEditor = () => {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMutation = useUpdateUserSettingsMutation();

  const [interlinearLines, setInterlinearLines] = useState<InterlinearLine[]>(
    userSettingsQuery.data?.interlinearLines ?? [],
  );

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedChange = useCallback(
    (value: InterlinearLine[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        updateUserSettingsMutation.mutate({ interlinearLines: value });
      }, 300);
    },
    [updateUserSettingsMutation],
  );

  const handleChange = useCallback(
    (value: InterlinearLine[], useDebounce?: boolean) => {
      setInterlinearLines(value);
      if (useDebounce) {
        debouncedChange(value);
      } else {
        updateUserSettingsMutation.mutate({ interlinearLines: value });
      }
    },
    [debouncedChange, updateUserSettingsMutation],
  );

  useEffect(() => {
    if (userSettingsQuery.data?.interlinearLines) {
      setInterlinearLines(userSettingsQuery.data.interlinearLines);
    }
  }, [userSettingsQuery.data?.interlinearLines]);

  return (
    <Reorder.Group
      values={interlinearLines}
      onReorder={(value) => handleChange(value, true)}
      axis="y"
    >
      {interlinearLines.map((line, i) => (
        <Fragment key={line.id}>
          <Line
            item={line}
            onChange={(newLine, useDebounce) =>
              handleChange(
                interlinearLines.map((line, idx) =>
                  idx === i ? newLine : line,
                ),
                useDebounce,
              )
            }
          />
          {i < interlinearLines.length - 1 && <Separator className="my-1" />}
        </Fragment>
      ))}
    </Reorder.Group>
  );
};

const Line = ({
  item,
  onChange,
}: {
  item: InterlinearLine;

  onChange: (line: InterlinearLine, useDebounce?: boolean) => void;
}) => {
  const controls = useDragControls();
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);

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
      className="bg-background flex items-center rounded-md"
    >
      <div
        onPointerDown={(event) => controls.start(event)}
        className="hover:bg-secondary flex h-8 w-6 cursor-grab items-center justify-center rounded-md"
      >
        <ReorderIcon className="h-4 w-4" />
      </div>
      <p
        className={cn("flex-1 truncate px-2", {
          "line-through": item.hidden,
        })}
      >
        {item.name}
      </p>
      <Button
        aria-label="Show or hide Line"
        onClick={onToggleHidden}
        size="icon"
        variant="ghost"
      >
        {item.hidden ? (
          <EyeOffIcon className="h-4 w-4" />
        ) : (
          <EyeIcon className="h-4 w-4" />
        )}
      </Button>
    </Reorder.Item>
  );
};

// const PromptTemplatePopover = () => {
//   const promptTemplate = useAppStore((state) => state.promptTemplate);
//   const setPromptTemplate = useAppStore((state) => state.setPromptTemplate);
//   const format = useFormatter();

//   return (
//     <div className="grid gap-2">
//       <Textarea
//         value={promptTemplate}
//         onChange={(e) => {
//           setPromptTemplate(e.currentTarget.value);
//         }}
//         className="resize-y"
//         rows={10}
//       />
//       <p className="text-muted-foreground text-sm">
//         Available Keys{" "}
//         {format.list(
//           AVAILABLE_PROMPT_TEMPLATE_KEYS.map((key) => (
//             <code key={key} className="font-semibold">
//               {key}
//             </code>
//           )),
//         )}
//       </p>
//     </div>
//   );
// };
