"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon, RefreshCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";

import type { InterlinearLine } from "@acme/core/validators";
import {
  DEFAULT_INTERLINEAR_LINE_STYLE,
  DEFAULT_INTERLINEAR_LINES,
} from "@acme/core/constants";

import InterlinearLinesEditor from "~/components/interlinear-line/InterlinearLineEditor";
import { Button } from "~/components/ui/button";
import { useUserSettings } from "~/providers/user-settings-provider";

export default function InterlinearLineSection() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { userSettings, updateUserSettings } = useUserSettings();

  const [interlinearLines, setInterlinearLines] = useState<InterlinearLine[]>(
    userSettings.interlinearLines,
  );

  const debouncedChange = useCallback(
    (value: InterlinearLine[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        updateUserSettings.mutate({ interlinearLines: value });
      }, 300);
    },
    [updateUserSettings],
  );

  const handleChange = useCallback(
    (value: InterlinearLine[], debounce?: boolean) => {
      setInterlinearLines(value);
      if (debounce) {
        debouncedChange(value);
      } else {
        updateUserSettings.mutate({ interlinearLines: value });
      }
    },
    [debouncedChange, updateUserSettings],
  );

  const handleAddNewLine = useCallback(() => {
    const newLines: InterlinearLine[] = [
      ...interlinearLines,
      {
        id: nanoid(),
        name: `line_${interlinearLines.length + 1}`,
        description: "Discribe what this line should generate",
        disappearing: "default",
        hidden: false,
        style: DEFAULT_INTERLINEAR_LINE_STYLE,
      },
    ];
    setInterlinearLines(newLines);
    updateUserSettings.mutate({ interlinearLines: newLines });
  }, [interlinearLines, updateUserSettings]);

  const handleResetLines = useCallback(() => {
    setInterlinearLines(DEFAULT_INTERLINEAR_LINES);
    updateUserSettings.mutate({
      interlinearLines: DEFAULT_INTERLINEAR_LINES,
    });
  }, [updateUserSettings]);

  useEffect(() => {
    setInterlinearLines(userSettings.interlinearLines);
  }, [userSettings.interlinearLines]);

  return (
    <section id="interlinear-lines" className="my-8">
      <h2 className="mb-4 text-xl font-medium">Interlinear Lines</h2>

      <div className="grid gap-6">
        <InterlinearLinesEditor
          interlinearLines={interlinearLines}
          onChange={handleChange}
        />
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleAddNewLine} variant="outline">
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Add New Line
          </Button>
          <Button variant="outline" onClick={handleResetLines}>
            <RefreshCcwIcon className="-ml-1 mr-2 h-4 w-4" />
            Reset List
          </Button>
        </div>
      </div>
    </section>
  );
}
