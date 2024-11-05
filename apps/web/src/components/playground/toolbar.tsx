"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  BookAIcon,
  EditIcon,
  MoreHorizontalIcon,
  SettingsIcon,
  SidebarCloseIcon,
  SidebarOpenIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import AppSettings from "~/components/AppSettings";
import SimpleInterlinearLineEditor from "~/components/SimpleInterlinearLineEditor";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { Slider } from "~/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useTrainingSession } from "~/providers/training-session-provider";
import { useAppStore } from "~/store/app-store";
import { useEditTrainingSessionDialog } from "../dialogs/edit-training-session-dialog";
import { useTrainingSessionView } from "./training-session-view";

export default function ToolBar({ children }: { children?: ReactNode }) {
  const { trainingSession } = useTrainingSession();
  const { sidebarOpen, setSidebarOpen, isComplete, closeSession } =
    useTrainingSessionView();

  const [EditTrainingSessionDialog, _, setEditTrainingSessionDialog] =
    useEditTrainingSessionDialog();

  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);

  const fontSize = useAppStore((state) => state.fontSize);
  const setFontSize = useAppStore((state) => state.setFontSize);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <header className="pointer-events-auto flex items-center gap-4 p-2">
        <div className="flex flex-1 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={closeSession}
              >
                <XIcon className="h-5 w-5" />
                <div className="sr-only">Close Session</div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close Session</TooltipContent>
          </Tooltip>

          <h1 className="flex-1 truncate text-lg font-medium max-md:hidden">
            {trainingSession.title}
          </h1>
        </div>

        {children}

        <div className="flex flex-1 items-center justify-end gap-2">
          {!isComplete && (
            <>
              <Tooltip>
                <Popover>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="max-md:hidden"
                      >
                        <BookAIcon className="h-5 w-5" />
                        <div className="sr-only">Reader Settings</div>
                      </Button>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <PopoverContent
                    className="max-h-[calc(100vh-10rem)] w-96 overflow-y-auto p-0"
                    side="bottom"
                    align="end"
                  >
                    <div className="p-4 pb-0">
                      <h2 className="text-lg font-semibold">Reader Settings</h2>
                    </div>

                    <div className="space-y-6 p-4">
                      <div className="flex items-center">
                        <Label htmlFor="theme-picker" className="flex-1">
                          Theme
                        </Label>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger id="theme-picker" className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              { value: "light", name: "Light" },
                              { value: "dark", name: "Dark" },
                              { value: "system", name: "System" },
                            ].map((item) => (
                              <SelectItem value={item.value} key={item.value}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="font-size">Font Size</Label>
                          <p className="text-muted-foreground text-sm">
                            {fontSize}px
                          </p>
                        </div>
                        <Slider
                          id="font-size"
                          defaultValue={[fontSize]}
                          min={12}
                          max={24}
                          step={2}
                          onValueChange={(values) =>
                            setFontSize(values[0] ?? 16)
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Interlinear Lines
                          </p>
                          <Link
                            href={`/app/${trainingSession.languageCode}/settings/reader#interlinear-lines`}
                            className="text-muted-foreground hover:text-foreground text-sm font-medium underline"
                          >
                            Edit
                          </Link>
                        </div>
                        <div>
                          <SimpleInterlinearLineEditor />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <TooltipContent side="bottom">Reader Settings</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontalIcon className="h-5 w-5 rotate-180" />
                        <div className="sr-only">Options</div>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Options</TooltipContent>
                </Tooltip>
                <DropdownMenuContent side="bottom" align="end">
                  <DropdownMenuItem
                    onClick={() => setEditTrainingSessionDialog(true)}
                  >
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSettingsSheetOpen(true)}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSettingsSheetOpen(true)}>
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSidebarOpen((open) => !open)}
                    className="max-md:hidden"
                  >
                    {sidebarOpen ? (
                      <SidebarCloseIcon className="h-5 w-5 rotate-180" />
                    ) : (
                      <SidebarOpenIcon className="h-5 w-5 rotate-180" />
                    )}
                    <div className="sr-only">
                      {sidebarOpen ? "Colapse Sidebar" : "Expand sidebar"}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {sidebarOpen ? "Colapse Sidebar" : "Expand sidebar"}
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </header>

      <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-screen border-none p-0 md:left-4 md:right-4 md:h-[calc(100vh-2rem)] md:rounded-t-xl"
        >
          <SheetTitle className="sr-only">App Settings</SheetTitle>
          <AppSettings />
        </SheetContent>
      </Sheet>

      <EditTrainingSessionDialog trainingSession={trainingSession} />
    </>
  );
}
