import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, XIcon } from "lucide-react";
import pluralize from "pluralize";

import type { Word } from "@acme/db/schema";

import type { LanguageCodeParams } from "~/types";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";

export default function AddWordsDialog({
  open,
  onOpenChange,
  action,
  title = "Add Words",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: {
    onClick?: (wordList: Word[]) => void;
    title?: string;
  };
  title?: string;
}) {
  const [wordsList, setWordsList] = useState<Word[]>([]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          onOpenChange(open);
          if (!open) {
            setWordsList([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {wordsList.length > 0 ? (
            <>
              <div>
                <ScrollArea className="h-[480px] rounded-lg border">
                  <div>
                    {wordsList.map((word) => (
                      <div
                        key={word.id}
                        className="hover:bg-secondary/50 flex h-14 items-center justify-between border-b px-4 last:border-b-0"
                      >
                        <p>{word.word}</p>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setWordsList(
                              wordsList.filter((w) => w.id !== word.id),
                            )
                          }
                          type="button"
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
                <p className="text-muted-foreground mt-2 text-sm">
                  Total {wordsList.length} {pluralize("word", wordsList.length)}
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary" type="button">
                    Done
                  </Button>
                </DialogClose>
                <Button
                  onClick={() => {
                    action?.onClick?.(wordsList);
                    onOpenChange(false);
                    setWordsList([]);
                  }}
                  type="button"
                >
                  {action?.title ?? "Done"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <AddWordsToListContent onWordsListGenerated={setWordsList} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddWordsToListContent({
  onWordsListGenerated,
}: {
  onWordsListGenerated: (list: Word[]) => void;
}) {
  return (
    <Tabs defaultValue="words-list">
      <TabsList>
        <TabsTrigger value="words-list">From Words List</TabsTrigger>
        <TabsTrigger value="piece-of-text">From Piece of Text</TabsTrigger>
      </TabsList>
      <TabsContent className="mt-4" value="words-list">
        <AddWordsFromList onWordsListGenerated={onWordsListGenerated} />
      </TabsContent>
      <TabsContent className="mt-4" value="piece-of-text">
        <AddWordsFromPieceOfText onWordsListGenerated={onWordsListGenerated} />
      </TabsContent>
    </Tabs>
  );
}

function AddWordsFromList({
  onWordsListGenerated,
}: {
  onWordsListGenerated: (list: Word[]) => void;
}) {
  const { languageCode } = useParams<LanguageCodeParams>();
  const [text, setText] = useState("");

  const utils = api.useUtils();
  const addWordsToPracticeListFromCommaSeparatedListMut =
    api.words.addWordsToPracticeListFromCommaSeparatedList.useMutation();

  const handelSubmit = useCallback(async () => {
    if (!text) {
      return;
    }

    const words =
      await addWordsToPracticeListFromCommaSeparatedListMut.mutateAsync({
        languageCode,
        text,
      });
    void utils.words.getUserWords.invalidate({ languageCode });
    onWordsListGenerated(words);
  }, [
    text,
    addWordsToPracticeListFromCommaSeparatedListMut,
    languageCode,
    utils.words.getUserWords,
    onWordsListGenerated,
  ]);

  return (
    <div className="space-y-4">
      <fieldset>
        <Textarea
          placeholder="Enter a list of words, separated by commas. Example: egg, dog, food, drink, etc."
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
        />
        <p className="text-muted-foreground mt-1 text-sm">
          If you add words that aren't in your current practice language, our AI
          will automatically translate them into your target language and add
          them to your practice list for continued learning.
        </p>
      </fieldset>
      <DialogFooter>
        <Button
          disabled={
            addWordsToPracticeListFromCommaSeparatedListMut.isPending ||
            addWordsToPracticeListFromCommaSeparatedListMut.isSuccess ||
            !text
          }
          type="button"
          onClick={handelSubmit}
        >
          {(addWordsToPracticeListFromCommaSeparatedListMut.isPending ||
            addWordsToPracticeListFromCommaSeparatedListMut.isSuccess) && (
            <Loader2 className="-ml-1 mr-2 h-4 w-4" />
          )}
          Continue
        </Button>
      </DialogFooter>
    </div>
  );
}

function AddWordsFromPieceOfText({
  onWordsListGenerated,
}: {
  onWordsListGenerated: (list: Word[]) => void;
}) {
  const { languageCode } = useParams<LanguageCodeParams>();
  const [text, setText] = useState("");

  const utils = api.useUtils();
  const addWordsToPracticeListFromPieceOfTextMut =
    api.words.addWordsToPracticeListFromPieceOfText.useMutation();

  const handelSubmit = useCallback(async () => {
    if (!text) {
      return;
    }

    const words = await addWordsToPracticeListFromPieceOfTextMut.mutateAsync({
      languageCode,
      text,
    });
    void utils.words.getUserWords.invalidate({ languageCode });

    onWordsListGenerated(words);
  }, [
    text,
    addWordsToPracticeListFromPieceOfTextMut,
    languageCode,
    utils.words.getUserWords,
    onWordsListGenerated,
  ]);

  return (
    <form className="space-y-4">
      <fieldset>
        <Textarea
          placeholder="Enter a piece of text, and our AI will automatically extract individual words from it."
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
        />

        <p className="text-muted-foreground mt-1 text-sm">
          If any part of the text isn't in your chosen practice language, our AI
          will automatically translate it into your target language and
          seamlessly add it to your practice list for continuous learning.
        </p>
      </fieldset>
      <DialogFooter>
        <Button
          disabled={
            addWordsToPracticeListFromPieceOfTextMut.isPending ||
            addWordsToPracticeListFromPieceOfTextMut.isSuccess ||
            !text
          }
          type="button"
          onClick={handelSubmit}
        >
          {(addWordsToPracticeListFromPieceOfTextMut.isPending ||
            addWordsToPracticeListFromPieceOfTextMut.isSuccess) && (
            <Loader2 className="-ml-1 mr-2 h-4 w-4" />
          )}
          Continue
        </Button>
      </DialogFooter>
    </form>
  );
}
