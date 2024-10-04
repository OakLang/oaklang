"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PlusIcon, RefreshCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";

import type { SpacedRepetitionStage } from "@acme/core/validators";
import { DEFAULT_SPACED_REPETITION_STAGES } from "@acme/core/constants";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { api } from "~/trpc/react";

const SpacedRepetitionStagesEditor = dynamic(
  () => import("~/components/SpacedRepetitionStagesEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4">
        <Skeleton className="h-14 border" />
        <Skeleton className="h-14 border" />
        <Skeleton className="h-14 border" />
        <Skeleton className="h-14 border" />
      </div>
    ),
  },
);

export default function SpacedRepetitionStagesSection() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMutation = useUpdateUserSettingsMutation();

  const [spacedRepetitionStages, setSpacedRepetitionStages] = useState<
    SpacedRepetitionStage[]
  >(userSettingsQuery.data?.spacedRepetitionStages ?? []);

  const debouncedChange = useCallback(
    (spacedRepetitionStages: SpacedRepetitionStage[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        updateUserSettingsMutation.mutate({ spacedRepetitionStages });
      }, 300);
    },
    [updateUserSettingsMutation],
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
    updateUserSettingsMutation.mutate({ spacedRepetitionStages: newStages });
  }, [spacedRepetitionStages, updateUserSettingsMutation]);

  const handleResetStages = useCallback(() => {
    setSpacedRepetitionStages(DEFAULT_SPACED_REPETITION_STAGES);
    updateUserSettingsMutation.mutate({
      spacedRepetitionStages: DEFAULT_SPACED_REPETITION_STAGES,
    });
  }, [updateUserSettingsMutation]);

  useEffect(() => {
    if (userSettingsQuery.data?.spacedRepetitionStages) {
      setSpacedRepetitionStages(userSettingsQuery.data.spacedRepetitionStages);
    }
  }, [userSettingsQuery.data?.spacedRepetitionStages]);

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
