import type { LucideIcon } from "lucide-react";
import { GalleryHorizontalIcon, ScrollTextIcon } from "lucide-react";

import type { TrainingSession } from "@acme/db/schema";
import { ALL_EXERCISE_IDS, FINITE_EXERCISES_IDS } from "@acme/core/constants";

import { useTrainingSession } from "~/providers/training-session-provider";
import { cn } from "~/utils";
import { Button } from "../ui/button";

const views: {
  value: TrainingSession["view"];
  name: string;
  icon: LucideIcon;
  availableFor: string[];
}[] = [
  {
    value: "sentence",
    name: "Sentence",
    icon: GalleryHorizontalIcon,
    availableFor: ALL_EXERCISE_IDS,
  },
  {
    value: "scroll",
    name: "Scroll",
    icon: ScrollTextIcon,
    availableFor: FINITE_EXERCISES_IDS,
  },
];

export default function PlaygroundFooter() {
  const { trainingSession, updateTrainingSession } = useTrainingSession();

  return (
    <div className="flex h-20 items-center border-t px-4">
      <div className="flex-1"></div>
      <div className="bg-secondary flex gap-1 rounded-lg p-1">
        {views
          .filter((view) =>
            view.availableFor.includes(trainingSession.exercise),
          )
          .map((view) => (
            <Button
              key={view.value}
              variant="ghost"
              onClick={() => {
                if (view.value !== trainingSession.view) {
                  updateTrainingSession.mutate({
                    trainingSessionId: trainingSession.id,
                    dto: {
                      view: view.value,
                    },
                  });
                }
              }}
              className={cn(
                "text-muted-foreground h-fit w-32 justify-center gap-0 py-3",
                {
                  "bg-background text-foreground hover:bg-background hover:text-foreground":
                    view.value === trainingSession.view,
                },
              )}
            >
              <view.icon className="mr-2 h-5 w-5" />
              <span>{view.name}</span>
            </Button>
          ))}
      </div>
      <div className="flex-1"></div>
    </div>
  );
}
