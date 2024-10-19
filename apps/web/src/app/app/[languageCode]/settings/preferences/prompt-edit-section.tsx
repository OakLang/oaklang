"use client";

import { useMemo } from "react";
import { Label } from "@radix-ui/react-label";
import { RefreshCcwIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFormatter } from "next-intl";

import {
  EXERCISE_1,
  EXERCISE_1_PROMPT_TEMPLATE_KEYS,
  INTERLINEAR_LINES_PROMPT_TEMPLATE_KEYS,
} from "@acme/core/constants";
import { hasPowerUserAccess } from "@acme/core/helpers";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useAppStore } from "~/store/app-store";

export default function PromptEditSection() {
  const { data } = useSession();
  const isPowerUser = useMemo(
    () => hasPowerUserAccess(data?.user.role),
    [data?.user.role],
  );
  const exercise1PromptTemplate = useAppStore(
    (state) => state.exercise1PromptTemplate,
  );
  const setExercise1PromptTemplate = useAppStore(
    (state) => state.setExercise1PromptTemplate,
  );
  const interlinearLinesPromptTemplate = useAppStore(
    (state) => state.interlinearLinesPromptTemplate,
  );
  const setInterlinearLinesPromptTemplate = useAppStore(
    (state) => state.setInterlinearLinesPromptTemplate,
  );
  const format = useFormatter();

  if (!isPowerUser) {
    return null;
  }

  return (
    <section id="interlinear-lines" className="my-8">
      <div className="mb-4">
        <h2 className="text-xl font-medium">GPT Prompt Templates</h2>
      </div>

      <div className="space-y-8">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="exercise-1-prompt-template">
              Exercise 1 ({EXERCISE_1.name}) Prompt Template
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() =>
                    setExercise1PromptTemplate(
                      useAppStore
                        .getInitialState()
                        .exercise1PromptTemplate.trim(),
                      false,
                    )
                  }
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <RefreshCcwIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to Default</TooltipContent>
            </Tooltip>
          </div>

          <Textarea
            id="exercise-1-prompt-template"
            value={exercise1PromptTemplate}
            onChange={(e) => {
              setExercise1PromptTemplate(e.currentTarget.value);
            }}
            className="bg-secondary/50 resize-y"
            rows={10}
          />
          <p className="text-muted-foreground text-sm">
            Available Keys{" "}
            {format.list(
              EXERCISE_1_PROMPT_TEMPLATE_KEYS.map((key) => (
                <code key={key} className="font-semibold">
                  {key}
                </code>
              )),
            )}
          </p>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="interlinear-lines-prompt-template">
              Interlinear Lines Prompt Template
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() =>
                    setInterlinearLinesPromptTemplate(
                      useAppStore
                        .getInitialState()
                        .interlinearLinesPromptTemplate.trim(),
                      false,
                    )
                  }
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <RefreshCcwIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to Default</TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="interlinear-lines-prompt-template"
            value={interlinearLinesPromptTemplate}
            onChange={(e) => {
              setInterlinearLinesPromptTemplate(e.currentTarget.value);
            }}
            className="bg-secondary/50 resize-y"
            rows={10}
          />
          <p className="text-muted-foreground text-sm">
            Available Keys{" "}
            {format.list(
              INTERLINEAR_LINES_PROMPT_TEMPLATE_KEYS.map((key) => (
                <code key={key} className="font-semibold">
                  {key}
                </code>
              )),
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
