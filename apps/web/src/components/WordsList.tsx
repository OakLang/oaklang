import React, { useCallback, useId, useState } from "react";
import { CopyIcon, DownloadIcon, UploadIcon, XIcon } from "lucide-react";
import pluralize from "pluralize";
import { Importer, ImporterField } from "react-csv-importer";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import "react-csv-importer/dist/index.css";

import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export default function WordsList({
  words,
  onWordsChange,
  title,
}: {
  onWordsChange: (words: string[]) => void;
  title: string;
  words: string[];
}) {
  const [input, setInput] = useState("");
  const [showCSVImporterModal, setShowCSVImporterModal] = useState(false);
  const id = useId();

  const handleAddWrods = useCallback(
    (newWords: string[]) => {
      const uniqueWords = newWords.filter((w) => !words.includes(w));
      onWordsChange([...words, ...uniqueWords]);
    },
    [onWordsChange, words],
  );

  const handleAddAll = useCallback(() => {
    const newWords = input
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    handleAddWrods(newWords);
    setInput("");
  }, [handleAddWrods, input]);

  const handleDownloadCSV = useCallback(() => {
    const content = [
      "Id,Word",
      ...words.map((word, i) => `${i + 1},${word}`),
    ].join("\n");
    const file = new Blob([content], { type: "text/plan" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "words.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }, [words]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(words.join(", "));
      toast("Copied to clipboard!");
    } catch (error) {
      toast("Faield to copy!", {
        description:
          (error as { message?: string }).message ?? "Something went wrong!",
      });
    }
  }, [words]);

  const handleClearList = useCallback(() => {
    onWordsChange([]);
  }, [onWordsChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-foreground font-semibold">
        {title}
        {words.length > 0
          ? ` (${words.length.toFixed()} ${pluralize("word", words.length)})`
          : null}
      </h3>
      <div className="flex flex-wrap gap-2">
        {words.length === 0 ? (
          <p className="text-muted-foreground text-sm">No words...</p>
        ) : (
          words.map((word) => (
            <Badge
              key={word}
              variant="outline"
              className="px-3 py-1 text-sm font-medium"
            >
              {word}
              <Button
                className="text-muted-foreground hover:text-foreground -mr-2 ml-1 h-6 w-6 rounded-full"
                onClick={() => {
                  onWordsChange(words.filter((w) => w !== word));
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </Badge>
          ))
        )}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddAll();
        }}
      >
        <Input
          className="text-foreground flex-1"
          id={id}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="Dog, Cat, Piece of cake, ..."
          value={input}
          autoFocus
        />
        <Button type="submit">Add All</Button>
      </form>
      <hr className="bg-border my-4 h-px" />
      <div className="grid gap-2">
        <Button onClick={() => setShowCSVImporterModal(true)} variant="outline">
          <UploadIcon className="-ml-1 mr-2 h-4 w-4" />
          Import from CSV
        </Button>
        <Button onClick={() => handleDownloadCSV()} variant="outline">
          <DownloadIcon className="-ml-1 mr-2 h-4 w-4" />
          Download as CSV
        </Button>
        <Button onClick={handleCopyToClipboard} variant="outline">
          <CopyIcon className="-ml-1 mr-2 h-4 w-4" />
          Copy to Clipboard
        </Button>
        <Button onClick={handleClearList} variant="outline">
          <XIcon className="-ml-1 mr-2 h-4 w-4" />
          Clear List
        </Button>
      </div>
      <Dialog
        onOpenChange={setShowCSVImporterModal}
        open={showCSVImporterModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import from CSV</DialogTitle>
          </DialogHeader>
          <CSVImporter
            onComplete={(words) => {
              handleAddWrods(words);
              setShowCSVImporterModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const CSVImporter = ({
  onComplete,
}: {
  onComplete: (words: string[]) => void;
}) => {
  const [words, setWords] = useState<string[]>([]);
  return (
    <Importer
      dataHandler={(rows, { startIndex }) => {
        console.log({ rows, startIndex });
        const words = rows.map((row) => row.word as string);
        setWords((list) => [...list, ...words]);
      }}
      onComplete={() => {
        onComplete(words);
      }}
    >
      <ImporterField label="Word" name="word" />
    </Importer>
  );
};
