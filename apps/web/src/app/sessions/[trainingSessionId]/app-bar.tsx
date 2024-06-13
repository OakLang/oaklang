"use client";

import { signOut } from "next-auth/react";

import KnownWordsPopoverContent from "~/components/KnownWordsPopoverContent";
import PracticeWordsPopoverContent from "~/components/PracticeWordsPopoverContent";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useTrainingSession } from "~/providers/TrainingSessionProvider";

export default function AppBar() {
  const { trainingSession } = useTrainingSession();
  // const settingsBtnTooltipProps = useHotkeysTooltipProps();
  // const [practiceVocabs, setPracticeVocabs] = useAtom(practiceVocabsAtom);
  // const [knownVocabs, setKnownVocabs] = useAtom(knownVocabsAtom);

  return (
    <header>
      <div className="container flex h-14 items-center gap-2 px-4">
        <h1 className="text-lg font-semibold">Oaklang</h1>
        <div className="flex-1" />

        {/* <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="outline">Practice Vocabs</Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {practiceVocabs.length
              ? practiceVocabs.join(", ")
              : "No Practice Vocabs"}
          </TooltipContent>
          <PopoverContent className="max-w-lg">
            <WordsList
              onWordsChange={setPracticeVocabs}
              title="Practice Vocabs"
              words={practiceVocabs}
            />
          </PopoverContent>
        </Tooltip>
      </Popover> */}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Practice Vocabs</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <PracticeWordsPopoverContent
              trainingSessionId={trainingSession.id}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Known Vocabs</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <KnownWordsPopoverContent trainingSessionId={trainingSession.id} />
          </PopoverContent>
        </Popover>

        {/* <Sheet onOpenChange={setSettingsOpen} open={settingsOpen}>
        <Tooltip {...settingsBtnTooltipProps}>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <SettingsIcon className="h-5 w-5" />
                <p className="sr-only">Settings</p>
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Hotkey: S(ettings)</TooltipContent>
        </Tooltip>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <SettingsForm />
        </SheetContent>
      </Sheet> */}

        <Button variant="outline" onClick={() => signOut()}>
          Sing Out
        </Button>
      </div>
    </header>
  );
}
