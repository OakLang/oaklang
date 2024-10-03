"use client";

import PracticeLanguageSwitcher from "~/components/PracticeLanguageSwitcher";
import { ThemeToggle } from "~/components/ThemeToggle";
import UserButton from "~/components/UserButton";
import { Link } from "~/i18n/routing";

export default function AppBar({
  practiceLanguage,
}: {
  practiceLanguage: string;
}) {
  return (
    <header className="bg-card text-card-foreground sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center gap-2 px-4">
        <h1 className="text-lg font-semibold">
          <Link href={`/app/${practiceLanguage}`}>Oaklang</Link>
        </h1>
        <div className="flex-1" />
        <PracticeLanguageSwitcher practiceLanguage={practiceLanguage} />
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
