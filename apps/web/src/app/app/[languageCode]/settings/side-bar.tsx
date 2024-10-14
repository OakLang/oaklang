import { useMemo } from "react";
import {
  BookOpenIcon,
  BookUserIcon,
  LanguagesIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { SideBarMenuItem } from "~/components/SideBarMenu";
import SideBarMenu from "~/components/SideBarMenu";

export default function SideBar({ languageCode }: { languageCode: string }) {
  const t = useTranslations("Settings.SideBar");
  const menu: SideBarMenuItem[] = useMemo(
    () => [
      {
        href: `/app/${languageCode}/settings`,
        name: t("account"),
        icon: <UserIcon className="h-4 w-4" />,
        exact: true,
      },
      {
        href: `/app/${languageCode}/settings/profile`,
        name: t("profile"),
        icon: <BookUserIcon className="h-4 w-4" />,
      },
      {
        href: `/app/${languageCode}/settings/preferences`,
        name: t("preferences"),
        icon: <SettingsIcon className="h-4 w-4" />,
      },
      {
        href: `/app/${languageCode}/settings/reader`,
        name: t("reader"),
        icon: <BookOpenIcon className="h-4 w-4" />,
      },
      {
        href: `/app/${languageCode}/settings/languages`,
        name: t("languages"),
        icon: <LanguagesIcon className="h-4 w-4" />,
      },
    ],
    [languageCode, t],
  );

  return (
    <aside className="bg-card text-card-foreground fixed bottom-0 left-0 top-16 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r">
      <header className="flex h-14 items-center px-8">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
      </header>
      <SideBarMenu data={menu} />
    </aside>
  );
}
