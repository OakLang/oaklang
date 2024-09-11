"use client";

import Link from "next/link";
import { useAtom } from "jotai";

import KnownWordsPopoverContent from "~/components/KnownWordsPopoverContent";
import PracticeWordsPopoverContent from "~/components/PracticeWordsPopoverContent";
import SettingsButton from "~/components/SettingsButton";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import UserButton from "~/components/UserButton";
import { knownWordsPopoverOpen, practiceWordsPopoverOpen } from "~/store";

export default function AppBar() {
  const [practicePopoverOpen, setPracticePopoverOpen] = useAtom(
    practiceWordsPopoverOpen,
  );
  const [knownPopoverOpen, setKnownPopoverOpen] = useAtom(
    knownWordsPopoverOpen,
  );
  return (
    <header className="bg-card border-b">
      <div className="flex h-16 items-center gap-2 px-4">
        <Link className="text-lg font-semibold" href="/app">
          Oaklang
        </Link>
        <div className="flex-1" />

        <Popover
          open={practicePopoverOpen}
          onOpenChange={setPracticePopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button variant="outline">Practice Vocabs</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <PracticeWordsPopoverContent />
          </PopoverContent>
        </Popover>

        <Popover open={knownPopoverOpen} onOpenChange={setKnownPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">Known Vocabs</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <KnownWordsPopoverContent />
          </PopoverContent>
        </Popover>

        <SettingsButton />
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
