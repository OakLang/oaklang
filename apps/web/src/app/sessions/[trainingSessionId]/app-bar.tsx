"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import KnownWordsPopoverContent from "~/components/KnownWordsPopoverContent";
import PracticeWordsPopoverContent from "~/components/PracticeWordsPopoverContent";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

export default function AppBar() {
  return (
    <header>
      <div className="container flex h-14 items-center gap-2 px-4">
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
        <ThemeToggle />
      </div>
    </header>
  );
}
