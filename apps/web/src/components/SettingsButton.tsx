import { useState } from "react";
import { SettingsIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";
import SettingsForm from "./SettingsForm";
import { Button } from "./ui/button";
import {
  Dialog,
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
      <DialogContent className="max-h-[calc(100vh-48px)] overflow-y-auto sm:max-w-[678px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <SettingsForm />
      </DialogContent>
    </Dialog>
  );
}
