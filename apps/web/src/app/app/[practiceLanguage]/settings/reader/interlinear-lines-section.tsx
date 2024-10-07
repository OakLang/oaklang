"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PlusIcon, RefreshCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";

import type { InterlinearLine } from "@acme/core/validators";
import {
  DEFAULT_INTERLINEAR_LINE_STYLE,
  DEFAULT_INTERLINEAR_LINES,
} from "@acme/core/constants";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { api } from "~/trpc/react";

const InterlinearLinesEditor = dynamic(
  () => import("~/components/InterlinearLineEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4">
        <Skeleton className="h-24 border" />
        <Skeleton className="h-24 border" />
        <Skeleton className="h-24 border" />
        <Skeleton className="h-24 border" />
        <Skeleton className="h-24 border" />
      </div>
    ),
  },
);

export default function InterlinearLineSection() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMutation = useUpdateUserSettingsMutation();

  const [interlinearLines, setInterlinearLines] = useState<InterlinearLine[]>(
    userSettingsQuery.data?.interlinearLines ?? [],
  );

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
    (value: InterlinearLine[]) => {
      setInterlinearLines(value);
      debouncedChange(value);
    },
    [debouncedChange],
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
    updateUserSettingsMutation.mutate({ interlinearLines: newLines });
  }, [interlinearLines, updateUserSettingsMutation]);

  const handleResetLines = useCallback(() => {
    setInterlinearLines(DEFAULT_INTERLINEAR_LINES);
    updateUserSettingsMutation.mutate({
      interlinearLines: DEFAULT_INTERLINEAR_LINES,
    });
  }, [updateUserSettingsMutation]);

  useEffect(() => {
    if (userSettingsQuery.data?.interlinearLines) {
      setInterlinearLines(userSettingsQuery.data.interlinearLines);
    }
  }, [userSettingsQuery.data?.interlinearLines]);

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
