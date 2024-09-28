import { CheckIcon, FilterIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { SentenceWord } from "@acme/db/schema";

import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { api } from "~/trpc/react";
import { cn, formatDate } from "~/utils";
import AudioPlayButton from "./AudioPlayButton";
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
  const openWindow = (url: string, target: string) => {
    window.open(url, target, "width=720,height=480");
  };
  const practiceLanguage = usePracticeLanguageCode();
  const userWordQuery = api.words.getUserWord.useQuery(
    {
      wordId: word.wordId,
    },
    { staleTime: 0 },
  );
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMut = useUpdateUserSettingsMutation();

  const utils = api.useUtils();
  const markWordKnownMutation = api.words.markWordKnown.useMutation({
    onMutate: (vars) => {
      utils.words.getUserWord.setData({ wordId: vars.wordId }, (word) =>
        word ? { ...word, knownAt: new Date() } : undefined,
      );
    },
    onSuccess: (_, vars) => {
      void utils.words.getUserWord.invalidate({ wordId: vars.wordId });
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguage);
      void utils.languages.getPracticeLanguages.invalidate();
    },
    onError: (error) => {
      toast(error.message);
    },
  });

  const markWordUnknownMutation = api.words.markWordUnknown.useMutation({
    onMutate: (vars) => {
      utils.words.getUserWord.setData({ wordId: vars.wordId }, (word) =>
        word ? { ...word, knownAt: null } : undefined,
      );
    },
    onSuccess: (_, vars) => {
      void utils.words.getUserWord.invalidate({ wordId: vars.wordId });
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguage);
      void utils.languages.getPracticeLanguages.invalidate();
    },
    onError: (error) => {
      toast(error.message);
    },
  });

  if (userWordQuery.isPending) {
    return (
      <div className="flex items-center gap-4 border-b p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    );
  }

  if (userWordQuery.isError) {
    return <p>{userWordQuery.error.message}</p>;
  }

  return (
    <div>
      <div className="grid gap-4 border-b p-4">
        <div className="flex items-center gap-4">
          <AudioPlayButton
            text={userWordQuery.data.word.word}
            className="h-12 w-12"
            autoPlay
          />
          <div className="flex-1">
            <p>{userWordQuery.data.word.word}</p>
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
                    !!userWordQuery.data.knownAt,
                })}
                onClick={() => {
                  if (userWordQuery.data.knownAt) {
                    markWordUnknownMutation.mutate({
                      wordId: userWordQuery.data.wordId,
                    });
                  } else {
                    markWordKnownMutation.mutate({
                      wordId: userWordQuery.data.wordId,
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
                  {userWordQuery.data.knownAt
                    ? "Mark as unknown"
                    : "Mark as known"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">
              {userWordQuery.data.knownAt ? "Mark as unknown" : "Mark as known"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-semibold">Dictionaries</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              openWindow(
                `https://en.wiktionary.org/wiki/${userWordQuery.data.word.word}`,
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
                `https://slovnik.seznam.cz/preklad/cesky_anglicky/${userWordQuery.data.word.word}`,
                "seznam",
              )
            }
          >
            Seznam (popup)
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
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
                  checked={line.hiddenInInspectionPanel ?? false}
                  onCheckedChange={(value) => {
                    updateUserSettingsMut.mutate({
                      interlinearLines:
                        userSettingsQuery.data.interlinearLines.map((l) =>
                          l.id === line.id
                            ? { ...l, hiddenInInspectionPanel: value }
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
        <div className="grid gap-2 text-sm">
          {userSettingsQuery.data?.interlinearLines
            .filter((line) => !line.hiddenInInspectionPanel)
            .map((line) => (
              <div key={line.id} className="flex items-center justify-between">
                <p>{line.name}</p>
                <p className="text-muted-foreground text-right">
                  {word.interlinearLines[line.name] ?? "-"}
                </p>
              </div>
            ))}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-semibold">Word (for test purpose)</h2>
        </div>
        <div className="grid gap-2 text-sm">
          {Object.entries({
            Id: userWordQuery.data.wordId,
            Word: userWordQuery.data.word.word,
            "Language Code": userWordQuery.data.word.languageCode,
            "Known At": userWordQuery.data.knownAt
              ? formatDate(userWordQuery.data.knownAt)
              : null,
            "Last Seen At": userWordQuery.data.lastSeenAt
              ? formatDate(userWordQuery.data.lastSeenAt)
              : null,
            "Last Practiced At": userWordQuery.data.lastPracticedAt
              ? formatDate(userWordQuery.data.lastPracticedAt)
              : null,
            "Next Practice At": userWordQuery.data.nextPracticeAt
              ? formatDate(userWordQuery.data.nextPracticeAt)
              : null,
            "Seen Count": userWordQuery.data.seenCount.toLocaleString(),
            "Practice Count": userWordQuery.data.practiceCount.toLocaleString(),
            "Seen Count Since Last Practiced":
              userWordQuery.data.seenCountSinceLastPracticed.toLocaleString(),
            "Spaced Repetition Stage": userWordQuery.data.spacedRepetitionStage,
          }).map((item) => (
            <div key={item[0]} className="flex items-center justify-between">
              <p>{item[0]}</p>
              <p className="text-muted-foreground text-right">
                {item[1] ?? "-"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
