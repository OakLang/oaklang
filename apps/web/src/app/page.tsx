"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

import LanguagePicker from "~/components/LanguagePicker";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import UserButton from "~/components/UserButton";
import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";
import { api } from "~/trpc/react";

export default function HomePage() {
  const session = useSession({
    required: true,
  });
  const startBtnTooltipProps = useHotkeysTooltipProps();
  const router = useRouter();
  const [helpLanguage, setHelpLanguage] = useState("en");
  const [practiceLanguage, setPracticeLanguage] = useState("es");
  const trainingSessionsQuery =
    api.trainingSessions.getTrainingSessions.useQuery();

  const startTrainingSession =
    api.trainingSessions.createTrainingSession.useMutation({
      onSuccess: (data) => {
        router.push(`/sessions/${data.id}`);
      },
      onError: (error) => {
        toast("Faield to create a new training session", {
          description: error.message,
        });
      },
    });

  const handleStartTraining = useCallback(() => {
    if (!helpLanguage || !practiceLanguage) {
      return;
    }
    startTrainingSession.mutate({
      helpLanguage,
      practiceLanguage,
    });
  }, [helpLanguage, practiceLanguage, startTrainingSession]);

  useHotkeys(
    "space",
    () => {
      handleStartTraining();
    },
    { enabled: !startTrainingSession.isPending },
  );

  if (session.status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <>
      <header className="bg-card border-b">
        <div className="flex h-16 items-center gap-2 px-4">
          <h1 className="text-lg font-semibold">
            <Link href="/">Oaklang</Link>
          </h1>
          <div className="flex-1" />
          <ThemeToggle />
          <UserButton />
        </div>
      </header>
      <div className="container my-8 max-w-screen-sm">
        <div className="flex flex-col gap-4 p-4">
          <fieldset>
            <Label>Help Language</Label>
            <LanguagePicker
              value={helpLanguage}
              onValueChange={setHelpLanguage}
            />
          </fieldset>
          <fieldset>
            <Label>Practice Language</Label>
            <LanguagePicker
              value={practiceLanguage}
              onValueChange={setPracticeLanguage}
            />
          </fieldset>
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
                href={`/sessions/${item.id}`}
                className="hover:bg-secondary/50 block border-b p-4"
              >
                <p>{item.title ?? "Untitled"}</p>
                <p className="text-muted-foreground text-sm">
                  <span>
                    Started{" "}
                    {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                  </span>
                  {" • "}
                  <span>Language: {item.practiceLanguageName}</span>
                  {" • "}
                  <span>Complexity: {item.complexity}</span>
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
