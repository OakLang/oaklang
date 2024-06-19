import { useState } from "react";
import { useAtom } from "jotai";
import { ExpandIcon } from "lucide-react";

import type { TrainingSession } from "@acme/db/schema";
import { voiceEnum } from "@acme/validators";

import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import { audioSettingsAtom, promptAtom } from "~/store";
import LanguagePicker from "./LanguagePicker";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const COMPLEXITIES: TrainingSession["complexity"][] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

export default function SettingsForm() {
  const [audioSettings, setAudioSettings] = useAtom(audioSettingsAtom);
  const { trainingSession, updateTrainingSession } = useTrainingSession();
  const [prompt, setPrompt] = useAtom(promptAtom);
  const [promptInputExpaned, setPromptInputExpaned] = useState(false);

  return (
    <div className="space-y-4 py-4">
      <fieldset className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="prompt-template">Propmt Template</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="hover:text-foreground text-muted-foreground p-1"
                onClick={() => setPromptInputExpaned(true)}
              >
                <ExpandIcon className="h-4 w-4" />
                <p className="sr-only">Expand</p>
              </button>
            </TooltipTrigger>
            <TooltipContent>Expand</TooltipContent>
          </Tooltip>
        </div>
        <Textarea
          id="prompt-template"
          onChange={(e) => setPrompt(e.currentTarget.value)}
          rows={5}
          value={prompt}
        />
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="help-language">Help Language</Label>
        <LanguagePicker
          value={trainingSession.helpLanguage}
          onValueChange={(helpLanguage) =>
            updateTrainingSession({ helpLanguage })
          }
        />
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="practice-language">Practice Language</Label>
        <LanguagePicker
          value={trainingSession.practiceLanguage}
          onValueChange={(practiceLanguage) =>
            updateTrainingSession({ practiceLanguage })
          }
        />
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
      <p className="pt-4 font-semibold">Audio Settings</p>
      <fieldset className="flex items-center justify-between">
        <Label htmlFor="auto-play">Auto Play</Label>
        <Switch
          checked={audioSettings.autoPlay}
          id="auto-play"
          onCheckedChange={(autoPlay) =>
            setAudioSettings({ ...audioSettings, autoPlay })
          }
        />
      </fieldset>

      <fieldset className="space-y-1">
        <Label htmlFor="voice">Voice</Label>
        <Select
          onValueChange={(value) =>
            setAudioSettings({
              ...audioSettings,
              voice: voiceEnum.parse(value),
            })
          }
          value={audioSettings.voice}
        >
          <SelectTrigger id="voice">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(voiceEnum.Values).map((voice) => (
              <SelectItem key={voice} value={String(voice)}>
                {voice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="speed">Speed ({audioSettings.speed}x)</Label>
        <Slider
          max={4}
          min={0.25}
          onValueChange={(values) =>
            setAudioSettings({ ...audioSettings, speed: values[0] ?? 1 })
          }
          step={0.1}
          value={[audioSettings.speed]}
        />
      </fieldset>

      <Dialog open={promptInputExpaned} onOpenChange={setPromptInputExpaned}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Prompt Template</DialogTitle>
          </DialogHeader>
          <Textarea
            onChange={(e) => setPrompt(e.currentTarget.value)}
            rows={20}
            value={prompt}
            className="resize-none"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button>Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
