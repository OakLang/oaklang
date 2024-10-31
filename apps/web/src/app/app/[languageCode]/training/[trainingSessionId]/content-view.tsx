"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useIsMutating } from "@tanstack/react-query";
import { getMutationKey } from "@trpc/react-query";
import {
  GalleryHorizontalIcon,
  Loader2Icon,
  ScrollTextIcon,
} from "lucide-react";

import { FINITE_EXERCISES } from "@acme/core/constants";

import type { RouterInputs } from "~/trpc/react";
import type { TrainingSessionParams } from "~/types";
import ScrollView from "~/components/ScrollView";
import { SentenceView } from "~/components/SentenceView";
import { SessionComplete } from "~/components/SessionComplete";
import { Button } from "~/components/ui/button";
import { useChangeTrainingSessionView } from "~/hooks/useUpdateTrainingSessionMutation";
import { api } from "~/trpc/react";
import { cn } from "~/utils";

const views: {
  value: RouterInputs["trainingSessions"]["changeView"]["view"];
  name: string;
  icon: LucideIcon;
}[] = [
  { value: "scroll", name: "Scroll", icon: ScrollTextIcon },
  { value: "sentence", name: "Sentence", icon: GalleryHorizontalIcon },
];

export default function ContentView() {
  const [showComplitionPage, setShowComplitionPage] = useState(false);
  const { trainingSessionId } = useParams<TrainingSessionParams>();

  const utils = api.useUtils();

  const isChangingIndex = useIsMutating({
    mutationKey: getMutationKey(api.trainingSessions.changeSentenceIndex),
  });

  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId },
  );
  const sentencesQuery = api.sentences.getSentences.useQuery({
    trainingSessionId,
  });

  const updateTrainingSessionView = useChangeTrainingSessionView();

  useEffect(() => {
    if (trainingSessionQuery.data?.status === "success") {
      void utils.sentences.getSentences.invalidate({ trainingSessionId });
    }
  }, [
    trainingSessionId,
    trainingSessionQuery.data?.status,
    utils.sentences.getSentences,
  ]);

  useEffect(() => {
    if (isChangingIndex > 0) {
      return;
    }

    let timeout: NodeJS.Timeout | null = null;
    if (
      trainingSessionQuery.isSuccess &&
      (trainingSessionQuery.data.status === "idle" ||
        trainingSessionQuery.data.status === "pending")
    ) {
      timeout = setInterval(() => {
        void utils.trainingSessions.getTrainingSession.invalidate({
          trainingSessionId,
        });
      }, 1000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [
    trainingSessionId,
    trainingSessionQuery.data?.status,
    trainingSessionQuery.isSuccess,
    utils.trainingSessions.getTrainingSession,
    isChangingIndex,
  ]);

  if (trainingSessionQuery.isError) {
    return <p>{trainingSessionQuery.error.message}</p>;
  }

  if (trainingSessionQuery.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2Icon className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (sentencesQuery.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2Icon className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground text-center">
            Loading Sentences...
          </p>
        </div>
      </div>
    );
  }

  if (sentencesQuery.isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-center">
            Setences Error: {sentencesQuery.error.message}
          </p>
        </div>
      </div>
    );
  }

  if (showComplitionPage) {
    return (
      <SessionComplete
        onBack={() => setShowComplitionPage(false)}
        trainingSession={trainingSessionQuery.data}
      />
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        {trainingSessionQuery.data.view === "sentence" ? (
          <SentenceView
            trainingSession={trainingSessionQuery.data}
            sentences={sentencesQuery.data}
            onComplete={() => setShowComplitionPage(true)}
          />
        ) : trainingSessionQuery.data.view === "page" ? (
          <p>Page View</p>
        ) : (
          <ScrollView
            trainingSession={trainingSessionQuery.data}
            sentences={sentencesQuery.data}
            onComplete={() => setShowComplitionPage(true)}
          />
        )}
      </div>

      <div className="flex items-center border-t p-4">
        <div className="flex-1"></div>
        {FINITE_EXERCISES.includes(trainingSessionQuery.data.exercise) && (
          <div className="bg-secondary flex gap-1 rounded-lg p-1">
            {views.map((view) => (
              <Button
                variant="ghost"
                onClick={() => {
                  if (view.value !== trainingSessionQuery.data.view) {
                    updateTrainingSessionView.mutate({
                      trainingSessionId,
                      view: view.value,
                    });
                  }
                }}
                className={cn("text-muted-foreground h-8", {
                  "bg-background text-foreground hover:bg-background hover:text-foreground":
                    view.value === trainingSessionQuery.data.view,
                })}
              >
                <view.icon className="-ml-1 mr-2 h-5 w-5" />
                {view.name}
              </Button>
            ))}
          </div>
        )}
        <div className="flex-1"></div>
      </div>
    </>
  );
}
