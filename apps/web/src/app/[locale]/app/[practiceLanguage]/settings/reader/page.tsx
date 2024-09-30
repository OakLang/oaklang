"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon, RefreshCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

import type { InterlinearLine } from "@acme/core/validators";
import { DEFAULT_INTERLINEAR_LINE_STYLE } from "@acme/core/validators";

import InterlinearLinesEditor from "~/components/InterlinearLineEditor";
import PageTitle from "~/components/PageTitle";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
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
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMutation = useUpdateUserSettingsMutation();

  const [interlinearLines, setInterlinearLines] = useState<InterlinearLine[]>(
    userSettingsQuery.data?.interlinearLines ?? [],
  );

  const resetInterlinearLinesMut =
    api.userSettings.resetInterlinearLines.useMutation({
      onError: (error) => {
        toast(error.message);
      },
      onSuccess: (value) => {
        setInterlinearLines(value);
        updateUserSettingsMutation.mutate({ interlinearLines: value });
      },
    });

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
    handleChange([
      ...interlinearLines,
      {
        id: nanoid(),
        name: `line_${interlinearLines.length + 1}`,
        description: "Discribe what this line should generate",
        disappearing: "default",
        hidden: false,
        style: DEFAULT_INTERLINEAR_LINE_STYLE,
      },
    ]);
  }, [handleChange, interlinearLines]);

  useEffect(() => {
    if (userSettingsQuery.data?.interlinearLines) {
      setInterlinearLines(userSettingsQuery.data.interlinearLines);
    }
  }, [userSettingsQuery.data?.interlinearLines]);

  return (
    <section id="interlinear-lines" className="my-8">
      <h2 className="mb-4 text-xl font-medium">Interlinear Lines</h2>

      <div>
        <InterlinearLinesEditor
          interlinearLines={interlinearLines}
          onChange={handleChange}
        />
        <div className="flex flex-wrap gap-4 pt-4">
          <Button onClick={handleAddNewLine} variant="outline">
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Add New Line
          </Button>
          <Button
            variant="outline"
            onClick={() => resetInterlinearLinesMut.mutate()}
            disabled={resetInterlinearLinesMut.isPending}
          >
            <RefreshCcwIcon className="-ml-1 mr-2 h-4 w-4" />
            Reset List
          </Button>
        </div>
      </div>
    </section>
  );
};
