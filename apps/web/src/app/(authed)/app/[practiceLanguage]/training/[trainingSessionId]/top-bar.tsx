"use client";

import Link from "next/link";
import {
  ArrowLeftIcon,
  MoreHorizontalIcon,
  SidebarCloseIcon,
  SidebarOpenIcon,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { usePracticeLanguage } from "~/providers/PracticeLanguageProvider";
import { useTrainingSession } from "~/providers/TrainingSessionProvider";

export default function TopBar() {
  const { trainingSession, sidebarOpen, setSidebarOpen } = useTrainingSession();
  const { practiceLanguage } = usePracticeLanguage();

  return (
    <header className="flex flex-shrink-0 items-center p-2">
      <div className="flex flex-1 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2" asChild>
              <Link href={`/app/${practiceLanguage.code}`}>
                <ArrowLeftIcon className="h-5 w-5" />
                <div className="sr-only">Back</div>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>

        <h1 className="text-lg font-medium">{trainingSession.title}</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
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
          <TooltipContent>
            {sidebarOpen ? "Colapse Sidebar" : "Expand sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
