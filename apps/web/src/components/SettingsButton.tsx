import { useState } from "react";
import { SettingsIcon, XIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";
import SettingsForm from "./SettingsForm";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function SettingsButton() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsBtnTooltipProps = useHotkeysTooltipProps();

  useHotkeys("s", () => {
    setSettingsOpen(!settingsOpen);
  });

  return (
    <Dialog onOpenChange={setSettingsOpen} open={settingsOpen}>
      <Tooltip {...settingsBtnTooltipProps}>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline">
              <SettingsIcon className="h-5 w-5" />
              <p className="sr-only">Settings</p>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Hotkey: S(ettings)</TooltipContent>
      </Tooltip>
      <DialogContent className="flex h-[768px] max-h-[min(768px,calc(100vh-48px))] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="bg-card sticky top-0 z-40 flex-shrink-0 border-b p-6">
          <DialogTitle>Settings</DialogTitle>
          <DialogClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-4 top-2"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <SettingsForm />
      </DialogContent>
    </Dialog>
  );
}
