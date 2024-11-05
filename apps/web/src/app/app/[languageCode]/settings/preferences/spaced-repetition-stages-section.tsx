"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon, RefreshCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";

import type { SpacedRepetitionStage } from "@acme/core/validators";
import { DEFAULT_SPACED_REPETITION_STAGES } from "@acme/core/constants";

import SpacedRepetitionStagesEditor from "~/components/SpacedRepetitionStagesEditor";
import { Button } from "~/components/ui/button";
import { useUserSettings } from "~/providers/user-settings-provider";

export default function SpacedRepetitionStagesSection() {
  const { userSettings, updateUserSettings } = useUserSettings();

  const [spacedRepetitionStages, setSpacedRepetitionStages] = useState<
    SpacedRepetitionStage[]
  >(userSettings.spacedRepetitionStages);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedChange = useCallback(
    (spacedRepetitionStages: SpacedRepetitionStage[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        updateUserSettings.mutate({ spacedRepetitionStages });
      }, 300);
    },
    [updateUserSettings],
  );

  const handleChange = useCallback(
    (spacedRepetitionStages: SpacedRepetitionStage[]) => {
      setSpacedRepetitionStages(spacedRepetitionStages);
      debouncedChange(spacedRepetitionStages);
    },
    [debouncedChange],
  );

  const handleAddNewStage = useCallback(() => {
    const newStages: SpacedRepetitionStage[] = [
      ...spacedRepetitionStages,
      {
        id: nanoid(),
        iteration: spacedRepetitionStages.length + 1,
        waitTime: "0",
        repetitions: 0,
        timesToShowDisappearing: 0,
      },
    ];
    setSpacedRepetitionStages(newStages);
    updateUserSettings.mutate({ spacedRepetitionStages: newStages });
  }, [spacedRepetitionStages, updateUserSettings]);

  const handleResetStages = useCallback(() => {
    setSpacedRepetitionStages(DEFAULT_SPACED_REPETITION_STAGES);
    updateUserSettings.mutate({
      spacedRepetitionStages: DEFAULT_SPACED_REPETITION_STAGES,
    });
  }, [updateUserSettings]);

  useEffect(() => {
    setSpacedRepetitionStages(userSettings.spacedRepetitionStages);
  }, [userSettings.spacedRepetitionStages]);

  return (
    <section id="interlinear-lines" className="my-8">
      <h2 className="mb-4 text-xl font-medium">Spaced Repetition Stages</h2>

      <div className="grid gap-4">
        <SpacedRepetitionStagesEditor
          items={spacedRepetitionStages}
          onChange={handleChange}
        />
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={handleAddNewStage}>
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Add new Stage
          </Button>
          <Button variant="outline" onClick={handleResetStages}>
            <RefreshCcwIcon className="-ml-1 mr-2 h-4 w-4" />
            Reset List
          </Button>
        </div>
      </div>
    </section>
  );
}
