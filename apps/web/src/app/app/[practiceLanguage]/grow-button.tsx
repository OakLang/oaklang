"use client";

import { useState } from "react";
import pluralize from "pluralize";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { api } from "~/trpc/react";

export default function GrowButton() {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const practiceLanguageCode = usePracticeLanguageCode();
  const parseTextAndAddWordsToPracticeListMut =
    api.words.addWordsToPracticeListFromPieceOfText.useMutation({
      onSuccess: (words) => {
        toast(
          `${words.length} new ${pluralize("word", words.length)} add to your practice list.`,
        );
        setOpen(false);
      },
      onError: (error) => {
        toast(error.message);
      },
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Grow</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grow</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <fieldset className="grid gap-2">
            <Label htmlFor="input">Input</Label>
            <Textarea
              id="input"
              value={inputText}
              onChange={(e) => setInputText(e.currentTarget.value)}
              rows={10}
              placeholder="Type a paragraph, sentence, word list, or any text you'd like to explore…"
              className="resize-none"
            />
          </fieldset>
          <div className="grid gap-2">
            <Button
              variant="outline"
              onClick={() =>
                parseTextAndAddWordsToPracticeListMut.mutate({
                  text: inputText,
                  languageCode: practiceLanguageCode,
                })
              }
              disabled={parseTextAndAddWordsToPracticeListMut.isPending}
            >
              Add Words to Practice List
            </Button>
            <Button variant="outline">Study it</Button>
            <Button variant="outline">Add it as a Module</Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
