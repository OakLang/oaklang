import type { MouseEvent } from "react";
import type { z } from "zod";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import type {
  InterlinearLine,
  interlinearLineActionSchema,
} from "@acme/core/validators";
import type { SentenceWord, UserWord, Word } from "@acme/db/schema";
import { InterlinearLineAction } from "@acme/core/constants";

import type { RouterOutputs } from "~/trpc/react";
import type { TrainingSessionParams } from "~/types";
import {
  useMarkWordKnownMutation,
  useMarkWordUnknownMutation,
  useUpdateUserWordMutation,
} from "~/hooks/mutations";
import { useDoubleClick } from "~/hooks/useDoubleClick";
import { useIntersectionObserver } from "~/hooks/useIntersectionObserver";
import usePlayTextToSpeech from "~/hooks/usePlayTextToSpeech";
import { useAppStore } from "~/store/app-store";
import { api } from "~/trpc/react";
import { cn, getCSSStyleForInterlinearLine } from "~/utils";
import { SentenceContext } from "./InterlinearLineSentence";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function InterlinearLineWordColumn({
  word: { word, userWord, ...sentenceWord },
}: {
  word: RouterOutputs["sentences"]["getSentence"]["words"][number];
}) {
  const userWordQuery = api.words.getUserWord.useQuery(
    {
      wordId: word.id,
    },
    {
      initialData: userWord
        ? {
            ...userWord,
            word,
          }
        : undefined,
    },
  );
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const { trainingSessionId } = useParams<TrainingSessionParams>();
  const seenWordMutation = api.words.seenWord.useMutation({
    onError: (error) => {
      toast(error.message);
    },
  });

  const onIntersect = useCallback(() => {
    seenWordMutation.mutate({
      sessionId: trainingSessionId,
      wordId: word.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingSessionId, word.id]);

  const ref = useIntersectionObserver({
    onIntersect,
  });

  return (
    <span className="flex flex-col items-center gap-2" ref={ref}>
      {userSettingsQuery.data?.interlinearLines
        .filter((line) => !line.hidden)
        .map((line) => {
          return (
            <InterlinearLineWordColumnCell
              key={line.id}
              line={line}
              word={word}
              userWord={userWordQuery.data}
              sentenceWord={sentenceWord}
            />
          );
        })}
    </span>
  );
}

const InterlinearLineWordColumnCell = ({
  line,
  word,
  sentenceWord,
  userWord,
}: {
  line: InterlinearLine;
  word: Word;
  userWord?: UserWord | null;
  sentenceWord: SentenceWord;
}) => {
  const { trainingSessionId } = useParams<TrainingSessionParams>();
  const sentenceCtx = useContext(SentenceContext);
  if (!sentenceCtx) {
    throw new Error("SentenceProvider not found in the tree");
  }
  const isPrimaryLine = useMemo(() => line.name === "text", [line.name]);

  const lineHidden = useMemo(
    () => userWord?.hideLines && line.disappearing === "default",
    [line.disappearing, userWord?.hideLines],
  );

  const setInspectionPanelOpen = useAppStore(
    (state) => state.setInspectionPanelOpen,
  );
  const fontSize = useAppStore((state) => state.fontSize);
  const inspectedWord = useAppStore((state) => state.inspectedWord);
  const setInspectedWord = useAppStore((state) => state.setInspectedWord);
  const [showLinePopover, setShowLinePopover] = useState(false);
  const [popoverLineName, setPopoverLineName] = useState<
    string | null | undefined
  >();
  const { audioRef, play, isFetching: isFetchingAudio } = usePlayTextToSpeech();
  const markWordKnownMut = useMarkWordKnownMutation();
  const markWordUnknownMut = useMarkWordUnknownMutation();
  const updateUserWord = useUpdateUserWordMutation();

  const hideLinesAction = useCallback(() => {
    updateUserWord.mutate({ wordId: word.id, hideLines: true });
  }, [updateUserWord, word.id]);

  const showLinesAction = useCallback(() => {
    updateUserWord.mutate({ wordId: word.id, hideLines: false });
  }, [updateUserWord, word.id]);

  const inspectWordAction = useCallback(() => {
    setInspectedWord({
      index: sentenceWord.index,
      interlinearLines: sentenceWord.interlinearLines,
      sentenceId: sentenceWord.sentenceId,
      wordId: word.id,
    });
    setInspectionPanelOpen(true);
  }, [
    sentenceWord.index,
    sentenceWord.interlinearLines,
    sentenceWord.sentenceId,
    setInspectedWord,
    setInspectionPanelOpen,
    word.id,
  ]);

  const markWordKnownAction = useCallback(() => {
    markWordKnownMut.mutate({
      wordId: word.id,
      sessionId: trainingSessionId,
    });
  }, [markWordKnownMut, trainingSessionId, word.id]);

  const markWordUnknownAction = useCallback(() => {
    markWordUnknownMut.mutate({ wordId: word.id });
  }, [markWordUnknownMut, word.id]);

  const readoutFullSentence = useCallback(async () => {
    await play(sentenceCtx.sentence.sentence);
  }, [play, sentenceCtx.sentence.sentence]);

  const handleAction = useCallback(
    (action: z.infer<typeof interlinearLineActionSchema>) => {
      switch (action.action) {
        case InterlinearLineAction.inspectWord:
          inspectWordAction();
          break;
        case InterlinearLineAction.markWordKnown:
          markWordKnownAction();
          break;
        case InterlinearLineAction.markWordUnknown:
          markWordUnknownAction();
          break;
        case InterlinearLineAction.toggleMarkWordKnownOrUnknown: {
          if (userWord?.knownAt) {
            markWordUnknownAction();
          } else {
            markWordKnownAction();
          }
          break;
        }
        case InterlinearLineAction.hideLines:
          hideLinesAction();
          break;
        case InterlinearLineAction.showLines:
          showLinesAction();
          break;
        case InterlinearLineAction.toggleHideOrShowLines: {
          if (userWord?.hideLines) {
            showLinesAction();
          } else {
            hideLinesAction();
          }
          break;
        }
        case InterlinearLineAction.readoutFullSentence: {
          void readoutFullSentence();
          break;
        }
        case InterlinearLineAction.readoutLine: {
          const text =
            action.lineName && sentenceWord.interlinearLines[action.lineName];
          if (text) {
            void play(text);
          }
          break;
        }
        case InterlinearLineAction.showLineInTooltip: {
          setPopoverLineName(action.lineName);
          setShowLinePopover(true);
          break;
        }
        default:
          break;
      }
    },
    [
      hideLinesAction,
      inspectWordAction,
      markWordKnownAction,
      markWordUnknownAction,
      play,
      readoutFullSentence,
      sentenceWord.interlinearLines,
      showLinesAction,
      userWord?.hideLines,
      userWord?.knownAt,
    ],
  );

  const doubleClickProps = useDoubleClick({
    onClick: () => {
      if (line.onClick) {
        handleAction(line.onClick);
      }
    },
    onDoubleClick: () => {
      if (line.onDoubleClick) {
        handleAction(line.onDoubleClick);
      }
    },
  });

  const onMouseEnter = useCallback(
    (e: MouseEvent) => {
      if (line.onHover) {
        e.preventDefault();
        handleAction(line.onHover);
      }
    },
    [handleAction, line.onHover],
  );

  const onMouseLeave = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setShowLinePopover(false);
  }, []);

  useEffect(() => {
    if (isFetchingAudio) {
      toast("Loading audio...", {
        id: "loading-audio-toast",
        dismissible: false,
      });
    } else {
      toast.dismiss("loading-audio-toast");
    }
  }, [isFetchingAudio]);

  return (
    <>
      <audio ref={audioRef} />
      <ContextMenu>
        <Tooltip open={showLinePopover}>
          <TooltipTrigger asChild>
            <ContextMenuTrigger asChild>
              <button
                {...doubleClickProps}
                className={cn(
                  "hover:ring-primary/50 pointer-events-auto clear-both cursor-pointer whitespace-nowrap rounded-md px-[4px] py-[2px] text-center ring-1 ring-transparent transition-colors duration-200",
                  isPrimaryLine
                    ? {
                        "bg-yellow-400/20": !!userWord?.knownAt,
                        "ring-yellow-400 hover:ring-yellow-400":
                          inspectedWord &&
                          inspectedWord.wordId === word.id &&
                          inspectedWord.index === sentenceWord.index,
                      }
                    : {},
                )}
                style={{
                  ...getCSSStyleForInterlinearLine(line),
                  fontSize: line.style.fontSize * (fontSize / 16),
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              >
                <p
                  className={cn({
                    "pointer-events-none select-none opacity-50 blur-sm":
                      lineHidden,
                  })}
                >
                  {sentenceWord.interlinearLines[line.name] ?? "-"}
                </p>
              </button>
            </ContextMenuTrigger>
          </TooltipTrigger>
          <TooltipContent align="center" side="bottom">
            {(popoverLineName &&
              sentenceWord.interlinearLines[popoverLineName]) ??
              "Line not found!"}
          </TooltipContent>
          {isPrimaryLine && (
            <ContextMenuContent>
              <ContextMenuItem
                onClick={inspectWordAction}
                disabled={inspectedWord?.wordId === word.id}
              >
                Inspect Word
              </ContextMenuItem>
              {userWord?.knownAt ? (
                <ContextMenuItem onClick={markWordUnknownAction}>
                  Mark Word Unknown
                </ContextMenuItem>
              ) : (
                <ContextMenuItem onClick={markWordKnownAction}>
                  Mark Word Known
                </ContextMenuItem>
              )}
              {userWord?.hideLines ? (
                <ContextMenuItem onClick={showLinesAction}>
                  Show Lines
                </ContextMenuItem>
              ) : (
                <ContextMenuItem onClick={hideLinesAction}>
                  Hide Lines
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          )}
        </Tooltip>
      </ContextMenu>
    </>
  );
};
