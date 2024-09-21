"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { useRouter } from "~/i18n/routing";

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
    </div>
  );
}
