import { useState } from "react";
import { SettingsIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";
import SettingsForm from "./SettingsForm";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function SettingsButton() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsBtnTooltipProps = useHotkeysTooltipProps();

  useHotkeys("s", () => {
    setSettingsOpen(!settingsOpen);
  });

  return (
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
  );
}
