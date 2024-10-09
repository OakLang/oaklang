import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Loader2, XIcon } from "lucide-react";
import pluralize from "pluralize";

import type { UserWordWithWord } from "@acme/api/validators";

import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { api } from "~/trpc/react";
import { unimplementedToast } from "~/utils/helpers";
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

export default function AddWordsToPracticeListDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [wordsList, setWordsList] = useState<UserWordWithWord[]>([]);

  useEffect(() => {
    setWordsList([]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {wordsList.length > 0 ? (
          <WordsListTable wordsList={wordsList} />
        ) : (
          <AddWordsToListContent onWordsListGenerated={setWordsList} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function WordsListTable({ wordsList }: { wordsList: UserWordWithWord[] }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Practice Words</DialogTitle>
      </DialogHeader>
      <div>
        <ScrollArea className="h-[480px] rounded-lg border">
          <div>
            {wordsList.map((word) => (
              <div
                key={word.wordId}
                className="hover:bg-secondary/50 flex h-14 items-center justify-between border-b px-4 last:border-b-0"
              >
                <p>{word.word}</p>
                <Button variant="outline" size="icon" className="h-8 w-8">
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
          <Button variant="secondary">Done</Button>
        </DialogClose>
        <Button onClick={unimplementedToast}>Start Training</Button>
      </DialogFooter>
    </>
  );
}

function AddWordsToListContent({
  onWordsListGenerated,
}: {
  onWordsListGenerated: (list: UserWordWithWord[]) => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Words to Practice List</DialogTitle>
      </DialogHeader>
      <Tabs>
        <TabsList>
          <TabsTrigger value="words-list">From Words List</TabsTrigger>
          <TabsTrigger value="piece-of-text">From Piece of Text</TabsTrigger>
          <TabsTrigger value="csv-file">From CSV File</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4" value="words-list">
          <AddWordsFromList onWordsListGenerated={onWordsListGenerated} />
        </TabsContent>
        <TabsContent className="mt-4" value="piece-of-text">
          <AddWordsFromPieceOfText
            onWordsListGenerated={onWordsListGenerated}
          />
        </TabsContent>
        <TabsContent className="mt-4" value="csv-file">
          Coming soon...
        </TabsContent>
      </Tabs>
    </>
  );
}

function AddWordsFromList({
  onWordsListGenerated,
}: {
  onWordsListGenerated: (list: UserWordWithWord[]) => void;
}) {
  const languageCode = usePracticeLanguageCode();
  const [text, setText] = useState("");

  const addWordsToPracticeListFromCommaSeparatedListMut =
    api.words.addWordsToPracticeListFromCommaSeparatedList.useMutation();

  const handelSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!text) {
        return;
      }

      const words =
        await addWordsToPracticeListFromCommaSeparatedListMut.mutateAsync({
          languageCode,
          text,
        });
      onWordsListGenerated(words);
    },
    [
      languageCode,
      onWordsListGenerated,
      addWordsToPracticeListFromCommaSeparatedListMut,
      text,
    ],
  );

  return (
    <form className="space-y-4" onSubmit={handelSubmit}>
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
      <Button
        disabled={
          addWordsToPracticeListFromCommaSeparatedListMut.isPending ||
          addWordsToPracticeListFromCommaSeparatedListMut.isSuccess ||
          !text
        }
      >
        {(addWordsToPracticeListFromCommaSeparatedListMut.isPending ||
          addWordsToPracticeListFromCommaSeparatedListMut.isSuccess) && (
          <Loader2 className="-ml-1 mr-2 h-4 w-4" />
        )}
        Add Words to List
      </Button>
    </form>
  );
}

function AddWordsFromPieceOfText({
  onWordsListGenerated,
}: {
  onWordsListGenerated: (list: UserWordWithWord[]) => void;
}) {
  const languageCode = usePracticeLanguageCode();
  const [text, setText] = useState("");

  const addWordsToPracticeListFromPieceOfTextMut =
    api.words.addWordsToPracticeListFromPieceOfText.useMutation();

  const handelSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!text) {
        return;
      }

      const words = await addWordsToPracticeListFromPieceOfTextMut.mutateAsync({
        languageCode,
        text,
      });
      onWordsListGenerated(words);
    },
    [
      languageCode,
      onWordsListGenerated,
      addWordsToPracticeListFromPieceOfTextMut,
      text,
    ],
  );

  return (
    <form className="space-y-4" onSubmit={handelSubmit}>
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
      <Button
        disabled={
          addWordsToPracticeListFromPieceOfTextMut.isPending ||
          addWordsToPracticeListFromPieceOfTextMut.isSuccess ||
          !text
        }
      >
        {(addWordsToPracticeListFromPieceOfTextMut.isPending ||
          addWordsToPracticeListFromPieceOfTextMut.isSuccess) && (
          <Loader2 className="-ml-1 mr-2 h-4 w-4" />
        )}
        Add Words to List
      </Button>
    </form>
  );
}
