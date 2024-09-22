"use client";

import { useCallback, useRef, useState } from "react";
import { PlusIcon, RefreshCcwIcon } from "lucide-react";
import { toast } from "sonner";

import type { InterlinearLine } from "@acme/core/validators";

import InterlinearLineEditor from "~/components/InterlinearLineEditor";
import PageTitle from "~/components/PageTitle";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useUserSettingsStore } from "~/providers/user-settings-store-provider";
import { api } from "~/trpc/react";

export default function ReaderPage() {
  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle title="Reader" description="Manage your reader settings" />
      <Separator className="my-8" />

      <InterlinearLinesConfigurationSection />
    </div>
  );
}

const InterlinearLinesConfigurationSection = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initInterlinearLines = useUserSettingsStore(
    (state) => state.userSettings.interlinearLines,
  );
  const changeInterlinearLines = useUserSettingsStore(
    (state) => state.setInterlinearLines,
  );
  const [interlinearLines, setInterlinearLines] =
    useState<InterlinearLine[]>(initInterlinearLines);

  const resetInterlinearLinesMut =
    api.userSettings.resetInterlinearLines.useMutation({
      onError: (error) => {
        toast(error.message);
      },
      onSuccess: (value) => {
        setInterlinearLines(value);
        changeInterlinearLines(value);
      },
    });

  const addNewInterlinearLineMut =
    api.userSettings.addNewInterlinearLine.useMutation({
      onError: (error) => {
        toast(error.message);
      },
      onSuccess: (value) => {
        setInterlinearLines(value);
        changeInterlinearLines(value);
      },
    });

  const debouncedChange = useCallback(
    (value: InterlinearLine[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        changeInterlinearLines(value);
      }, 300);
    },
    [changeInterlinearLines],
  );

  const handleChange = useCallback(
    (value: InterlinearLine[]) => {
      setInterlinearLines(value);
      debouncedChange(value);
    },
    [debouncedChange],
  );

  return (
    <div className="my-8">
      <h2 className="mb-4 text-xl font-medium">Interlinear Lines</h2>

      <div>
        <InterlinearLineEditor
          interlinearLines={interlinearLines}
          onChange={handleChange}
        />
        <div className="flex flex-wrap gap-4 pt-4">
          <Button
            onClick={() => addNewInterlinearLineMut.mutate()}
            disabled={
              resetInterlinearLinesMut.isPending ||
              addNewInterlinearLineMut.isPending
            }
          >
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Add New Line
          </Button>
          <Button
            variant="outline"
            onClick={() => resetInterlinearLinesMut.mutate()}
            disabled={
              resetInterlinearLinesMut.isPending ||
              addNewInterlinearLineMut.isPending
            }
          >
            <RefreshCcwIcon className="-ml-1 mr-2 h-4 w-4" />
            Reset List
          </Button>
        </div>
      </div>
    </div>
  );
};
