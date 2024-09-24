"use client";

import { useParams } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import PageTitle from "~/components/PageTitle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { useRouter } from "~/i18n/routing";
import { useAppStore } from "~/providers/app-store-provider";
import { AVAILABLE_PROMPT_TEMPLATE_KEYS } from "~/utils/constants";

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const { practiceLanguage } = useParams<{ practiceLanguage: string }>();
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
    </div>
  );
}

const PromptTemplate = () => {
  const promptTemplate = useAppStore((state) => state.promptTemplate);
  const setPromptTemplate = useAppStore((state) => state.setPromptTemplate);
  const format = useFormatter();

  return (
    <section id="interlinear-lines" className="my-8">
      <div className="mb-4">
        <h2 className="text-xl font-medium">GPT Prompt Template</h2>
        <p className="text-muted-foreground text-sm">
          This prompt will be used as a context to generate sentences using GPT
        </p>
      </div>
      <div className="grid gap-2">
        <Textarea
          value={promptTemplate}
          onChange={(e) => {
            setPromptTemplate(e.currentTarget.value);
          }}
          className="resize-y"
          rows={20}
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
    </section>
  );
};
