"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@radix-ui/react-label";
import { PlusIcon, RefreshCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import type { SpacedRepetitionStage } from "@acme/core/validators";

import PageTitle from "~/components/PageTitle";
import SpacedRepetitionStagesEditor from "~/components/SpacedRepetitionStagesEditor";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { useRouter } from "~/i18n/routing";
import { useAppStore } from "~/providers/app-store-provider";
import { api } from "~/trpc/react";
import { AVAILABLE_PROMPT_TEMPLATE_KEYS } from "~/utils/constants";

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const practiceLanguage = usePracticeLanguageCode();
  const t = useTranslations("PreferencesPage");

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle title={t("title")} description={t("description")} />

      <Separator className="my-8" />

      <div className="my-8">
        <h2 className="mb-4 text-xl font-medium">{t("general")}</h2>

        <div className="mb-4 flex items-center">
          <div className="flex-1">
            <p>{t("language")}</p>
          </div>
          <Select
            defaultValue={locale}
            onValueChange={(newLocale) => {
              router.push(`/app/${practiceLanguage}/settings/preferences`, {
                locale: newLocale as never,
              });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "en", name: "English" },
                { value: "de", name: "German" },
              ].map((item) => (
                <SelectItem value={item.value} key={item.value}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center">
          <div className="flex-1">
            <p>{t("theme")}</p>
          </div>
          <Select value={theme ?? "system"} onValueChange={setTheme}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "light", name: t("light") },
                { value: "dark", name: t("dark") },
                { value: "system", name: t("system") },
              ].map((item) => (
                <SelectItem value={item.value} key={item.value}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="my-8" />

      <PromptTemplate />
      <Separator className="my-8" />
      <SpacedRepetitionStagesConfigurationSection />
    </div>
  );
}

const PromptTemplate = () => {
  const generateSentencesPromptTemplate = useAppStore(
    (state) => state.generateSentencesPromptTemplate,
  );
  const setGenerateSentencesPromptTemplate = useAppStore(
    (state) => state.setGenerateSentencesPromptTemplate,
  );
  const generateSentenceWordsPromptTemplate = useAppStore(
    (state) => state.generateSentenceWordsPromptTemplate,
  );
  const setGenerateSentenceWordsPromptTemplate = useAppStore(
    (state) => state.setGenerateSentenceWordsPromptTemplate,
  );
  const format = useFormatter();

  return (
    <section id="interlinear-lines" className="my-8">
      <div className="mb-4">
        <h2 className="text-xl font-medium">GPT Prompt Templates</h2>
      </div>

      <div className="mb-6 grid gap-2">
        <Label htmlFor="generateSentencesPromptTemplate">
          Generate Sentences Prompt Template
        </Label>
        <Textarea
          id="generateSentencesPromptTemplate"
          value={generateSentencesPromptTemplate}
          onChange={(e) => {
            setGenerateSentencesPromptTemplate(e.currentTarget.value);
          }}
          className="resize-y"
          rows={10}
        />
        <p className="text-muted-foreground text-sm">
          Available Keys{" "}
          {format.list(
            AVAILABLE_PROMPT_TEMPLATE_KEYS.map((key) => (
              <code key={key} className="font-semibold">
                {key}
              </code>
            )),
          )}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="generateSentenceWordsPromptTemplate">
          Generate Sentence Words Prompt Template
        </Label>
        <Textarea
          id="generateSentenceWordsPromptTemplate"
          value={generateSentenceWordsPromptTemplate}
          onChange={(e) => {
            setGenerateSentenceWordsPromptTemplate(e.currentTarget.value);
          }}
          className="resize-y"
          rows={10}
        />
        <p className="text-muted-foreground text-sm">
          Available Keys{" "}
          {format.list(
            ["{PRACTICE_LANGUAGE}", "{NATIVE_LANGUAGE}", "{SENTENCE}"].map(
              (key) => (
                <code key={key} className="font-semibold">
                  {key}
                </code>
              ),
            ),
          )}
        </p>
      </div>
    </section>
  );
};

const SpacedRepetitionStagesConfigurationSection = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMutation = useUpdateUserSettingsMutation();

  const [spacedRepetitionStages, setSpacedRepetitionStages] = useState<
    SpacedRepetitionStage[]
  >(userSettingsQuery.data?.spacedRepetitionStages ?? []);

  const resetSpacedRepetitionStagesMut =
    api.userSettings.resetSpacedRepetitionStages.useMutation({
      onError: (error) => {
        toast(error.message);
      },
      onSuccess: (spacedRepetitionStages) => {
        setSpacedRepetitionStages(spacedRepetitionStages);
        updateUserSettingsMutation.mutate({ spacedRepetitionStages });
      },
    });

  const debouncedChange = useCallback(
    (spacedRepetitionStages: SpacedRepetitionStage[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        updateUserSettingsMutation.mutate({ spacedRepetitionStages });
      }, 300);
    },
    [updateUserSettingsMutation],
  );

  const handleChange = useCallback(
    (spacedRepetitionStages: SpacedRepetitionStage[]) => {
      setSpacedRepetitionStages(spacedRepetitionStages);
      debouncedChange(spacedRepetitionStages);
    },
    [debouncedChange],
  );

  useEffect(() => {
    if (userSettingsQuery.data?.spacedRepetitionStages) {
      setSpacedRepetitionStages(userSettingsQuery.data.spacedRepetitionStages);
    }
  }, [userSettingsQuery.data?.spacedRepetitionStages]);

  return (
    <section id="interlinear-lines" className="my-8">
      <h2 className="mb-4 text-xl font-medium">Spaced Repetition Stages</h2>

      <div>
        <SpacedRepetitionStagesEditor
          items={spacedRepetitionStages}
          onChange={handleChange}
        />
        <div className="flex flex-wrap gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() =>
              handleChange([
                ...spacedRepetitionStages,
                {
                  id: nanoid(),
                  iteration: spacedRepetitionStages.length + 1,
                  waitTime: "0",
                  repetitions: 0,
                  timesToShowDisappearing: 0,
                },
              ])
            }
          >
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Add new Iteration
          </Button>
          <Button
            variant="outline"
            onClick={() => resetSpacedRepetitionStagesMut.mutate()}
            disabled={resetSpacedRepetitionStagesMut.isPending}
          >
            <RefreshCcwIcon className="-ml-1 mr-2 h-4 w-4" />
            Reset List
          </Button>
        </div>
      </div>
    </section>
  );
};
