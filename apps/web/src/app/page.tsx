"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
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
    startTrainingSession.mutate({ helpLanguage, practiceLanguage });
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
      <div className="container my-8 max-w-sm">
        <div className="flex flex-col gap-4">
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
      </div>
    </>
  );
}
