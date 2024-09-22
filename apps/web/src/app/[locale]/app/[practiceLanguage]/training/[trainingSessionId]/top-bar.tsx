"use client";

import { useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  BookAIcon,
  MoreHorizontalIcon,
  SidebarCloseIcon,
  SidebarOpenIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "~/components/ui/button";
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
import { Slider } from "~/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Link } from "~/i18n/routing";
import { useAppStore } from "~/providers/app-store-provider";
import { api } from "~/trpc/react";

export default function TopBar() {
  const { trainingSessionId } = useParams<{ trainingSessionId: string }>();
  const trainingSessionQuery =
    api.trainingSessions.getTrainingSession.useQuery(trainingSessionId);
  const inspectionPanelOpen = useAppStore((state) => state.inspectionPanelOpen);
  const setInspectionPanelOpen = useAppStore(
    (state) => state.setInspectionPanelOpen,
  );
  const fontSize = useAppStore((state) => state.fontSize);
  const setFontSize = useAppStore((state) => state.setFontSize);

  const { practiceLanguage } = useParams<{
    practiceLanguage: string;
  }>();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex flex-shrink-0 items-center p-2">
      <div className="flex flex-1 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2" asChild>
              <Link href={`/app/${practiceLanguage}`}>
                <ArrowLeftIcon className="h-5 w-5" />
                <div className="sr-only">Back</div>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>

        <h1 className="text-lg font-medium">
          {trainingSessionQuery.data?.title}
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost">
                  <BookAIcon className="h-5 w-5" />
                  <div className="sr-only">Reader Settings</div>
                </Button>
              </TooltipTrigger>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="end">
              <div className="p-4 pb-0">
                <h2 className="text-lg font-semibold">Reader Settings</h2>
              </div>

              <div className="space-y-4 p-4">
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
                    onValueChange={(values) => setFontSize(values[0] ?? 16)}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <TooltipContent>Reader Settings</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontalIcon className="h-5 w-5 rotate-180" />
              <div className="sr-only">Options</div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Options</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setInspectionPanelOpen(!inspectionPanelOpen)}
            >
              {inspectionPanelOpen ? (
                <SidebarCloseIcon className="h-5 w-5 rotate-180" />
              ) : (
                <SidebarOpenIcon className="h-5 w-5 rotate-180" />
              )}
              <div className="sr-only">
                {inspectionPanelOpen ? "Colapse Sidebar" : "Expand sidebar"}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {inspectionPanelOpen ? "Colapse Sidebar" : "Expand sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
