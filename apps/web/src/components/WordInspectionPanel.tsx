import { useMemo } from "react";
import { useParams } from "next/navigation";
import { CheckIcon, FilterIcon, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

import type { SentenceWord } from "@acme/db/schema";
import { hasPowerUserAccess } from "@acme/core/helpers";

import type { TrainingSessionParams } from "~/types";
import {
  useMarkWordKnownMutation,
  useMarkWordUnknownMutation,
} from "~/hooks/mutations";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { api } from "~/trpc/react";
import { cn, formatDate } from "~/utils";
import AudioPlayButton from "./AudioPlayButton";
import ObjectDetailsList from "./ObjectDetailsList";
import RenderQueryResult from "./RenderQueryResult";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function WordInspectionPanel({ word }: { word: SentenceWord }) {
  const { data } = useSession();
  const isPowerUser = useMemo(
    () => hasPowerUserAccess(data?.user.role),
    [data?.user.role],
  );

  const openWindow = (url: string, target: string) => {
    window.open(url, target, "width=720,height=480");
  };
  const { trainingSessionId } = useParams<TrainingSessionParams>();
  const userWordQuery = api.words.getUserWord.useQuery({
    wordId: word.wordId,
  });
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMut = useUpdateUserSettingsMutation();

  const markWordKnownMutation = useMarkWordKnownMutation();
  const markWordUnknownMutation = useMarkWordUnknownMutation();

  const wordText = useMemo(
    () => word.interlinearLines.text ?? userWordQuery.data?.word.word ?? "",
    [userWordQuery.data?.word.word, word.interlinearLines.text],
  );

  return (
    <RenderQueryResult
      query={userWordQuery}
      renderLoading={() => (
        <div className="flex items-center gap-4 border-b p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      )}
    >
      {({ data: userWord }) => (
        <>
          <div className="grid gap-4 border-b p-4">
            <div className="flex items-center gap-4">
              <AudioPlayButton
                value={wordText}
                autoPlay={userSettingsQuery.data?.autoPlayAudio}
              />
              <div className="flex-1">
                <p>{wordText}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    disabled={
                      markWordKnownMutation.isPending ||
                      markWordUnknownMutation.isPending
                    }
                    className={cn("text-muted-foreground rounded-full", {
                      "bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 hover:text-yellow-500 dark:text-yellow-500":
                        !!userWord.knownAt,
                    })}
                    onClick={() => {
                      if (userWord.knownAt) {
                        markWordUnknownMutation.mutate({
                          wordId: userWord.wordId,
                        });
                      } else {
                        markWordKnownMutation.mutate({
                          wordId: userWord.wordId,
                          sessionId: trainingSessionId,
                        });
                      }
                    }}
                    size="icon"
                  >
                    {markWordKnownMutation.isPending ||
                    markWordUnknownMutation.isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <CheckIcon className="h-6 w-6" />
                    )}
                    <span className="sr-only">
                      {userWord.knownAt ? "Mark as unknown" : "Mark as known"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" align="center">
                  {userWord.knownAt ? "Mark as unknown" : "Mark as known"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-8 py-4">
            <div className="space-y-4">
              <div className="flex items-center px-4">
                <h2 className="text-lg font-semibold">Dictionaries</h2>
              </div>

              <div className="flex flex-wrap gap-2 px-4">
                <Button
                  variant="secondary"
                  onClick={() =>
                    openWindow(
                      `https://en.wiktionary.org/wiki/${userWord.word.word}`,
                      "wiktionary",
                    )
                  }
                >
                  Wiktionary (popup)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    openWindow(
                      `https://slovnik.seznam.cz/preklad/cesky_anglicky/${userWord.word.word}`,
                      "seznam",
                    )
                  }
                >
                  Seznam (popup)
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-semibold">Interlinear Lines</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <FilterIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {userSettingsQuery.data?.interlinearLines.map((line) => (
                      <DropdownMenuCheckboxItem
                        checked={!line.hiddenInInspectionPanel}
                        onCheckedChange={(value) => {
                          updateUserSettingsMut.mutate({
                            interlinearLines:
                              userSettingsQuery.data.interlinearLines.map(
                                (l) =>
                                  l.id === line.id
                                    ? { ...l, hiddenInInspectionPanel: !value }
                                    : l,
                              ),
                          });
                        }}
                      >
                        {line.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ObjectDetailsList
                data={Object.fromEntries(
                  (userSettingsQuery.data?.interlinearLines ?? [])
                    .filter((line) => !line.hiddenInInspectionPanel)
                    .map((item) => [
                      item.name,
                      word.interlinearLines[item.name] ?? "-",
                    ]),
                )}
              />
            </div>

            {isPowerUser && (
              <div className="space-y-4">
                <div className="flex items-center px-4">
                  <h2 className="text-lg font-semibold">
                    Word (for test purpose)
                  </h2>
                </div>
                <ObjectDetailsList
                  data={{
                    Id: userWord.wordId,
                    Word: userWord.word.word,
                    "Language Code": userWord.word.languageCode,
                    "Known At": userWord.knownAt
                      ? formatDate(userWord.knownAt)
                      : null,
                    "Last Seen At": userWord.lastSeenAt
                      ? formatDate(userWord.lastSeenAt)
                      : null,
                    "Last Practiced At": userWord.lastPracticedAt
                      ? formatDate(userWord.lastPracticedAt)
                      : null,
                    "Next Practice At": userWord.nextPracticeAt
                      ? formatDate(userWord.nextPracticeAt)
                      : null,
                    "Seen Count": userWord.seenCount.toLocaleString(),
                    "Practice Count": userWord.practiceCount.toLocaleString(),
                    "Seen Count Since Last Practiced":
                      userWord.seenCountSinceLastPracticed.toLocaleString(),
                    "Spaced Repetition Stage": userWord.spacedRepetitionStage,
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </RenderQueryResult>
  );
}
