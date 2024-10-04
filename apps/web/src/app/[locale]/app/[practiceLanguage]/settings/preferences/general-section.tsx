"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useRouter } from "~/i18n/routing";

export default function GeneralSection({
  practiceLanguage,
}: {
  practiceLanguage: string;
}) {
  const t = useTranslations("PreferencesPage");

  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-medium">{t("general")}</h2>

      <div className="grid gap-4">
        <div className="flex items-center">
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
                // { value: "de", name: "German" },
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
