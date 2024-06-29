"use client";

import Link from "next/link";

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

export default function AppBar() {
  return (
    <header className="bg-card border-b">
      <div className="flex h-16 items-center gap-2 px-4">
        <Link className="text-lg font-semibold" href="/">
          Oaklang
        </Link>
        <div className="flex-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Practice Vocabs</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <PracticeWordsPopoverContent />
          </PopoverContent>
        </Popover>

        <Popover>
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
