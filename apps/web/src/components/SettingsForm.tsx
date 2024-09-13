import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";

import type { InterlinearLine } from "@acme/core/validators";
import type { TrainingSession } from "@acme/db/schema";

import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import { promptAtom } from "~/store";
import { api } from "~/trpc/react";
import { cn } from "~/utils";
import { APP_NAME } from "~/utils/constants";
import { AudioSettings } from "./AudioSettings";
import InterlinearLineEditor from "./InterlinearLineEditor";
import LanguagePicker from "./LanguagePicker";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

const InterlinearLinesPagee = () => {
  const [interlinearLines, setInterlinearLines] = useState<InterlinearLine[]>(
    [],
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interlinearLinesQuery = api.userSettings.getUserSettings.useQuery();
  const utils = api.useUtils();

  const updateInterlinearLinesMut =
    api.userSettings.updateUserSettings.useMutation({
      onSuccess: () => {
        toast("Saved Changes");
        void utils.userSettings.getUserSettings.invalidate();
      },
      onError: (error) => {
        toast(error.message);
      },
    });
  const resetInterlinearLinesMut =
    api.userSettings.resetInterlinearLines.useMutation({
      onError: (error) => {
        toast(error.message);
      },
      onSuccess: (value) => {
        setInterlinearLines(value);
      },
    });

  const addNewInterlinearLineMut =
    api.userSettings.addNewInterlinearLine.useMutation({
      onError: (error) => {
        toast(error.message);
      },
      onSuccess: (value) => {
        setInterlinearLines(value);
      },
    });

  const debouncedChange = useCallback(
    (value: InterlinearLine[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        updateInterlinearLinesMut.mutate({ interlinearLines: value });
      }, 300);
    },
    [updateInterlinearLinesMut],
  );

  const handleChange = useCallback(
    (value: InterlinearLine[]) => {
      setInterlinearLines(value);
      debouncedChange(value);
    },
    [debouncedChange],
  );

  useEffect(() => {
    setInterlinearLines(interlinearLinesQuery.data?.interlinearLines ?? []);
  }, [interlinearLinesQuery.data]);

  return (
    <div className="">
      {interlinearLinesQuery.isPending ? (
        <p>Loading...</p>
      ) : interlinearLinesQuery.isError ? (
        <p>{interlinearLinesQuery.error.message}</p>
      ) : (
        <InterlinearLineEditor
          interlinearLines={interlinearLines}
          onChange={handleChange}
        />
      )}
      <div className="flex flex-wrap gap-4 pt-4">
        <Button
          onClick={() => addNewInterlinearLineMut.mutate()}
          disabled={
            resetInterlinearLinesMut.isPending ||
            updateInterlinearLinesMut.isPending ||
            addNewInterlinearLineMut.isPending
          }
        >
          Add New Line
        </Button>
        <Button
          variant="destructive"
          onClick={() => resetInterlinearLinesMut.mutate()}
          disabled={
            resetInterlinearLinesMut.isPending ||
            updateInterlinearLinesMut.isPending ||
            addNewInterlinearLineMut.isPending
          }
        >
          Reset List
        </Button>
      </div>
    </div>
  );
};

const UserSettings = () => {
  const [prompt, setPrompt] = useAtom(promptAtom);

  return (
    <div className="grid grid-cols-2 gap-4">
      <fieldset className="col-span-full space-y-1">
        <Label htmlFor="prompt-template">Propmt Template</Label>
        <Textarea
          id="prompt-template"
          onChange={(e) => setPrompt(e.currentTarget.value)}
          rows={10}
          value={prompt}
        />
      </fieldset>
    </div>
  );
};

export const voices: { voice: string; name: string }[] = [
  { voice: "alloy", name: "Alloy" },
  { voice: "echo", name: "Echo" },
  { voice: "fable", name: "Fable" },
  { voice: "onyx", name: "Onyx" },
  { voice: "nova", name: "Nova" },
  { voice: "shimmer", name: "Shimmer" },
];

const COMPLEXITIES: TrainingSession["complexity"][] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

const TrainingSessionSettings = () => {
  const { trainingSession, updateTrainingSession } = useTrainingSession();

  const debouncedSetTitle = useDebounceCallback((newTitle: string) => {
    updateTrainingSession({ title: newTitle });
    window.document.title = `${newTitle || "Untitled"} - ${APP_NAME}`;
  }, 300);

  return (
    <div className="grid grid-cols-2 gap-4">
      <fieldset className="col-span-full space-y-1">
        <Label htmlFor="help-language">Title</Label>
        <Input
          defaultValue={trainingSession.title ?? ""}
          placeholder="Learn Spanish"
          onChange={(e) => {
            debouncedSetTitle(e.currentTarget.value);
          }}
        />
      </fieldset>

      <fieldset className="space-y-1">
        <Label htmlFor="help-language">Help Language</Label>
        <LanguagePicker value={trainingSession.helpLanguage} disabled />
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="practice-language">Practice Language</Label>
        <LanguagePicker value={trainingSession.practiceLanguage} disabled />
      </fieldset>

      <fieldset className="space-y-1">
        <Label htmlFor="practice-language">Num of Sentences</Label>
        <Select
          onValueChange={(value) =>
            updateTrainingSession({
              sentencesCount: Number(value),
            })
          }
          value={String(trainingSession.sentencesCount)}
        >
          <SelectTrigger id="practice-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[3, 4, 5, 6, 7, 8].map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>

      <fieldset className="space-y-1">
        <Label htmlFor="complexity">Complexity</Label>
        <Select
          onValueChange={(value) =>
            updateTrainingSession({
              complexity: value as TrainingSession["complexity"],
            })
          }
          value={trainingSession.complexity}
        >
          <SelectTrigger id="complexity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPLEXITIES.map((complexity) => (
              <SelectItem key={complexity} value={String(complexity)}>
                {complexity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
    </div>
  );
};

interface NavItem {
  id: string;
  name: string;
  content: ReactNode;
}

export default function SettingsForm() {
  const { trainingSessionId } = useParams<{ trainingSessionId?: string }>();

  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: "general",
        name: "General",
        content: <UserSettings />,
      },
      {
        id: "interlinear_lines",
        name: "Interlinear Lines",
        content: <InterlinearLinesPagee />,
      },
      {
        id: "audio",
        name: "Audio",
        content: <AudioSettings />,
      },
      ...(trainingSessionId
        ? [
            {
              id: "training_session_settings",
              name: "Training Session",
              content: <TrainingSessionSettings />,
            } satisfies NavItem,
          ]
        : []),
    ],
    [trainingSessionId],
  );

  const [navId, setNavId] = useState(navItems[0]?.id ?? "");
  const navItem = useMemo(
    () => navItems.find((item) => item.id === navId)?.content ?? null,
    [navId, navItems],
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-48 flex-shrink-0 p-4 pr-0">
        <div className="grid gap-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => setNavId(item.id)}
              className={cn("text-muted-foreground justify-start text-left", {
                "bg-secondary text-foreground": item.id === navId,
              })}
              variant="ghost"
            >
              {item.name}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{navItem}</div>
    </div>
  );
}
