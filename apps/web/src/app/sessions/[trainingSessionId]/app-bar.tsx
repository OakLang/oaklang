"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useHotkeys } from "react-hotkeys-hook";

import KnownWordsPopoverContent from "~/components/KnownWordsPopoverContent";
import PracticeWordsPopoverContent from "~/components/PracticeWordsPopoverContent";
import SettingsForm from "~/components/SettingsForm";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";

export default function AppBar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsBtnTooltipProps = useHotkeysTooltipProps();
  const { data } = useSession({ required: true });

  useHotkeys("n", () => {
    setSettingsOpen(!settingsOpen);
  });

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

        <Sheet onOpenChange={setSettingsOpen} open={settingsOpen}>
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
        </Sheet>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="rounded-full">
              <Avatar>
                <AvatarFallback>
                  <UserIcon className="h-5 w-5" />
                </AvatarFallback>
                {data?.user.image ? (
                  <AvatarImage src={data.user.image} />
                ) : null}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="p-2">
              <p className="text-muted-foreground text-sm">Signed in as</p>
              <p className="font-medium">{data?.user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
