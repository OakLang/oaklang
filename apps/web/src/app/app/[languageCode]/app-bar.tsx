"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import PracticeLanguageSwitcher from "~/components/PracticeLanguageSwitcher";
import PrefetchLink from "~/components/PrefetchLink";
import { ThemeToggle } from "~/components/ThemeToggle";
import UserButton from "~/components/UserButton";
import { usePracticeLanguage } from "~/providers/practice-language-provider";
import { cn } from "~/utils";

export default function AppBar() {
  const { language } = usePracticeLanguage();
  const pathname = usePathname();

  return (
    <header className="bg-card text-card-foreground sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center gap-2 px-4">
        <h1 className="text-lg font-semibold">
          <PrefetchLink href={`/app/${language.code}`}>Oaklang</PrefetchLink>
        </h1>
        <div className="ml-6 flex items-center gap-4">
          <Link
            className={cn(
              "text-muted-foreground hover:text-foreground text-sm font-medium",
              {
                "text-foreground": pathname === `/app/${language.code}`,
              },
            )}
            href={`/app/${language.code}`}
            prefetch={true}
          >
            Learning
          </Link>
          <Link
            className={cn(
              "text-muted-foreground hover:text-foreground text-sm font-medium",
              {
                "text-foreground":
                  pathname === `/app/${language.code}/collections`,
              },
            )}
            href={`/app/${language.code}/collections`}
            prefetch={true}
          >
            Collections
          </Link>
          <Link
            className={cn(
              "text-muted-foreground hover:text-foreground text-sm font-medium",
              {
                "text-foreground": pathname === `/app/${language.code}/words`,
              },
            )}
            href={`/app/${language.code}/words`}
            prefetch={true}
          >
            Words
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-1">
          <PracticeLanguageSwitcher />
          <ThemeToggle />
          <UserButton languageCode={language.code} />
        </div>
      </div>
    </header>
  );
}
