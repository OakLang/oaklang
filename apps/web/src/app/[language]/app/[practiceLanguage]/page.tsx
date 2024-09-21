"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";
import { api } from "~/trpc/react";

export default function AppPage() {
  const { language, practiceLanguage } = useParams<{
    language: string;
    practiceLanguage: string;
  }>();
  const startBtnTooltipProps = useHotkeysTooltipProps();
  const router = useRouter();
  const trainingSessionsQuery =
    api.trainingSessions.getTrainingSessions.useQuery({
      languageCode: practiceLanguage,
    });

  const startTrainingSession =
    api.trainingSessions.createTrainingSession.useMutation({
      onSuccess: (data) => {
        router.push(
          `/${language}/app/${data.languageCode}/training/${data.id}`,
        );
      },
      onError: (error) => {
        toast("Faield to create a new training session", {
          description: error.message,
        });
      },
    });

  const handleStartTraining = useCallback(() => {
    startTrainingSession.mutate({ languageCode: practiceLanguage });
  }, [startTrainingSession, practiceLanguage]);

  useHotkeys(
    "space",
    () => {
      handleStartTraining();
    },
    { enabled: !startTrainingSession.isPending },
  );

  return (
    <div className="container my-8 max-w-screen-sm">
      <div className="flex flex-col gap-4 p-4">
        <Tooltip {...startBtnTooltipProps}>
          <TooltipTrigger asChild>
            <Button
              onClick={handleStartTraining}
              disabled={startTrainingSession.isPending}
            >
              {startTrainingSession.isPending && (
                <Loader2Icon className="-ml-1 mr-2 h-4 w-4 animate-spin" />
              )}
              Start Training
            </Button>
          </TooltipTrigger>
          <TooltipContent>Hotkey: Space</TooltipContent>
        </Tooltip>
      </div>
      <div className="bg-border my-4 h-px"></div>
      <div>
        <div className="p-4">
          <p className="text-lg font-medium">Sessions</p>
        </div>
        {trainingSessionsQuery.isPending ? (
          <p>Loading...</p>
        ) : trainingSessionsQuery.isError ? (
          <p>{trainingSessionsQuery.error.message}</p>
        ) : (
          trainingSessionsQuery.data.map((item) => (
            <Link
              key={item.id}
              href={`/${language}/app/${item.languageCode}/training/${item.id}`}
              className="hover:bg-secondary/50 block rounded-md p-4"
            >
              <p>{item.title ?? "Untitled"}</p>
              <p className="text-muted-foreground text-sm">
                <span>
                  Started{" "}
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </span>
                {" • "}
                <span>Language: {item.languageName}</span>
                {" • "}
                <span>Complexity: {item.complexity}</span>
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
