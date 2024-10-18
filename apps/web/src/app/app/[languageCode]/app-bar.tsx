"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import PracticeLanguageSwitcher from "~/components/PracticeLanguageSwitcher";
import PrefetchLink from "~/components/PrefetchLink";
import { ThemeToggle } from "~/components/ThemeToggle";
import UserButton from "~/components/UserButton";
import { cn } from "~/utils";

export default function AppBar({ languageCode }: { languageCode: string }) {
  const pathname = usePathname();

  return (
    <header className="bg-card text-card-foreground sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center gap-2 px-4">
        <h1 className="text-lg font-semibold">
          <PrefetchLink href={`/app/${languageCode}`}>Oaklang</PrefetchLink>
        </h1>
        <div className="ml-6 flex items-center gap-4">
          <Link
            className={cn(
              "text-muted-foreground hover:text-foreground text-sm font-medium",
              {
                "text-foreground": pathname === `/app/${languageCode}`,
              },
            )}
            href={`/app/${languageCode}`}
          >
            Training
          </Link>
          <Link
            className={cn(
              "text-muted-foreground hover:text-foreground text-sm font-medium",
              {
                "text-foreground": pathname === `/app/${languageCode}/words`,
              },
            )}
            href={`/app/${languageCode}/words`}
          >
            Words
          </Link>
        </div>
        <div className="flex-1" />
        <PracticeLanguageSwitcher practiceLanguageCode={languageCode} />
        <ThemeToggle />
        <UserButton languageCode={languageCode} />
      </div>
    </header>
  );
}
