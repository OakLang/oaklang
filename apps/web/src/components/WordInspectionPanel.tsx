import { useParams } from "next/navigation";
import { CheckIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Word } from "@acme/db/schema";

import { api } from "~/trpc/react";
import { cn } from "~/utils";
import AudioPlayButton from "./AudioPlayButton";
import { Button } from "./ui/button";

export default function WordInspectionPanel({ word }: { word: Word }) {
  const openWindow = (url: string, target: string) => {
    window.open(url, target, "width=720,height=480");
  };
  const { practiceLanguage } = useParams<{ practiceLanguage: string }>();
  const pracitceWordQuery = api.words.getPracticeWord.useQuery({
    wordId: word.id,
  });

  const utils = api.useUtils();
  const markWordKnownMutation = api.words.markWordKnown.useMutation({
    onMutate: (vars) => {
      utils.words.getPracticeWord.setData({ wordId: vars.wordId }, (word) =>
        word ? { ...word, knownAt: new Date() } : undefined,
      );
    },
    onSuccess: (_, vars) => {
      void utils.words.getPracticeWord.invalidate({ wordId: vars.wordId });
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguage);
      void utils.languages.getPracticeLanguages.invalidate(undefined, {
        type: "active",
      });
    },
    onError: (error) => {
      toast(error.message);
    },
  });

  const markWordUnknownMutation = api.words.markWordUnknown.useMutation({
    onMutate: (vars) => {
      utils.words.getPracticeWord.setData({ wordId: vars.wordId }, (word) =>
        word ? { ...word, knownAt: null } : undefined,
      );
    },
    onSuccess: (_, vars) => {
      void utils.words.getPracticeWord.invalidate({ wordId: vars.wordId });
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguage);
      void utils.languages.getPracticeLanguages.invalidate(undefined, {
        type: "active",
      });
    },
    onError: (error) => {
      toast(error.message);
    },
  });

  if (pracitceWordQuery.isPending) {
    return <p>Loading...</p>;
  }

  if (pracitceWordQuery.isError) {
    return <p>{pracitceWordQuery.error.message}</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 border-b p-4">
        <AudioPlayButton text={word.word} className="h-12 w-12" autoPlay />
        <p>{word.word}</p>
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
                `https://en.wiktionary.org/wiki/${word.word}`,
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
                `https://slovnik.seznam.cz/preklad/cesky_anglicky/${word.word}`,
                "seznam",
              )
            }
          >
            Seznam (popup)
          </Button>
        </div>
      </div>
      <div className="p-4 pt-0">
        <Button
          variant="outline"
          disabled={
            markWordKnownMutation.isPending || markWordUnknownMutation.isPending
          }
          className={cn({
            "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 hover:text-yellow-500":
              !!pracitceWordQuery.data.knownAt,
          })}
          onClick={() => {
            if (pracitceWordQuery.data.knownAt) {
              markWordUnknownMutation.mutate({ wordId: word.id });
            } else {
              markWordKnownMutation.mutate({ wordId: word.id });
            }
          }}
        >
          {markWordKnownMutation.isPending ||
          markWordUnknownMutation.isPending ? (
            <Loader2 className="-mr-1 ml-2 h-4 w-4 animate-spin" />
          ) : pracitceWordQuery.data.knownAt ? (
            <CheckIcon className="-ml-1 mr-2 h-4 w-4" />
          ) : null}
          Known
        </Button>
      </div>
    </div>
  );
}
