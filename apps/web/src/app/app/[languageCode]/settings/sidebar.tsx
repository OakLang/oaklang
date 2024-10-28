"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  BookOpenIcon,
  BookUserIcon,
  LanguagesIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { LanguageCodeParams } from "~/types";
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

export default function SettingsSidebar() {
  const { languageCode } = useParams<LanguageCodeParams>();
  const t = useTranslations("Settings.SideBar");
  const pathname = usePathname();
  const menu = useMemo(
    () => [
      {
        url: `/app/${languageCode}/settings`,
        title: t("account"),
        icon: UserIcon,
        exact: true,
      },
      {
        url: `/app/${languageCode}/settings/profile`,
        title: t("profile"),
        icon: BookUserIcon,
      },
      {
        url: `/app/${languageCode}/settings/preferences`,
        title: t("preferences"),
        icon: SettingsIcon,
      },
      {
        url: `/app/${languageCode}/settings/reader`,
        title: t("reader"),
        icon: BookOpenIcon,
      },
      {
        url: `/app/${languageCode}/settings/languages`,
        title: t("languages"),
        icon: LanguagesIcon,
      },
    ],
    [languageCode, t],
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
