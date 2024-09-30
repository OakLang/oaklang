"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import type { InterlinearLine } from "@acme/core/validators";

import { ReorderIcon } from "~/components/icons/drag-icon";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useRaisedShadow } from "~/hooks/useRaisedShadow";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { api } from "~/trpc/react";
import { cn } from "~/utils";

export default function SimpleInterlinearLineEditor() {
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
          <InterlinearLineItem
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
}

function InterlinearLineItem({
  item,
  onChange,
}: {
  item: InterlinearLine;
  onChange: (line: InterlinearLine, useDebounce?: boolean) => void;
}) {
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
}
