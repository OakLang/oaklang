"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";
import { api } from "~/trpc/react";

export default function HomePage() {
  const session = useSession({
    required: true,
  });
  const startBtnTooltipProps = useHotkeysTooltipProps();
  const router = useRouter();

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
    startTrainingSession.mutate({ helpLanguage: "en", practiceLanguage: "es" });
  }, [startTrainingSession]);

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
      <header>
        <div className="container flex h-14 items-center gap-2 px-4">
          <h1 className="text-lg font-semibold">Oaklang</h1>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => signOut()}>
            Sing Out
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <div className="my-8 flex items-center justify-center">
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
    </>
  );
}
