"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  BookUserIcon,
  HeadphonesIcon,
  LanguagesIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { usePracticeLanguage } from "~/providers/PracticeLanguageProvider";
import { cn } from "~/utils";

export default function SideBar() {
  const { language } = usePracticeLanguage();
  const pathname = usePathname();
  const menu: {
    href: string;
    name: string;
    icon: ReactNode;
  }[] = [
    {
      href: `/app/${language.code}/settings`,
      name: "Account",
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      href: `/app/${language.code}/settings/profile`,
      name: "Profile",
      icon: <BookUserIcon className="h-4 w-4" />,
    },
    {
      href: `/app/${language.code}/settings/preferences`,
      name: "Preferences",
      icon: <SettingsIcon className="h-4 w-4" />,
    },
    {
      href: `/app/${language.code}/settings/reader`,
      name: "Reader",
      icon: <BookOpenIcon className="h-4 w-4" />,
    },
    {
      href: `/app/${language.code}/settings/audio`,
      name: "Audio",
      icon: <HeadphonesIcon className="h-4 w-4" />,
    },
    {
      href: `/app/${language.code}/settings/languages`,
      name: "Languages",
      icon: <LanguagesIcon className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="bg-card text-card-foreground fixed bottom-0 left-0 top-16 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r">
      <header className="flex h-14 items-center px-8">
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <nav className="grid gap-1 p-4 pt-0">
        {menu.map((item) => {
          const isActive = item.href === pathname;
          return (
            <Button
              key={item.href}
              asChild
              className={cn(
                "text-muted-foreground flex items-center justify-start text-left",
                {
                  "bg-secondary text-foreground": isActive,
                },
              )}
              variant="ghost"
            >
              <Link href={item.href}>
                <span className="-ml-1 mr-2">{item.icon}</span>
                {item.name}
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
