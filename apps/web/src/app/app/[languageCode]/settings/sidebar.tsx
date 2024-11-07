"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  BotIcon,
  LanguagesIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { useHasPowerUserAccess } from "~/hooks/useHasPowerUserAccess";
import { usePracticeLanguage } from "~/providers/practice-language-provider";

export default function SettingsSidebar() {
  const hasPowerUserAccess = useHasPowerUserAccess();
  const { language } = usePracticeLanguage();
  const t = useTranslations("Settings.SideBar");
  const pathname = usePathname();
  const menu = useMemo(
    () => [
      {
        url: `/app/${language.code}/settings`,
        title: t("account"),
        icon: UserIcon,
        exact: true,
      },
      {
        url: `/app/${language.code}/settings/preferences`,
        title: t("preferences"),
        icon: SettingsIcon,
      },
      {
        url: `/app/${language.code}/settings/reader`,
        title: t("reader"),
        icon: BookOpenIcon,
      },
      {
        url: `/app/${language.code}/settings/languages`,
        title: t("languages"),
        icon: LanguagesIcon,
      },
      ...(hasPowerUserAccess
        ? [
            {
              url: `/app/${language.code}/settings/ai-prompts`,
              title: "AI Prompts",
              icon: BotIcon,
            },
          ]
        : []),
    ],
    [hasPowerUserAccess, language.code, t],
  );

  return (
    <Sidebar>
      <SidebarContent>
        <div className="h-16" />
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.exact
                        ? pathname === item.url
                        : pathname.startsWith(item.url)
                    }
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
