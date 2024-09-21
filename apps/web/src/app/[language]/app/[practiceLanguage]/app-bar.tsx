"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import PracticeLanguageSwitcher from "~/components/PracticeLanguageSwitcher";
import UserButton from "~/components/UserButton";

export default function AppBar() {
  const { language, practiceLanguage } = useParams<{
    language: string;
    practiceLanguage: string;
  }>();

  return (
    <header className="bg-card text-card-foreground sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center gap-2 px-4">
        <h1 className="text-lg font-semibold">
          <Link href={`/${language}/app/${practiceLanguage}`}>Oaklang</Link>
        </h1>
        <div className="flex-1" />
        <PracticeLanguageSwitcher />
        <UserButton />
      </div>
    </header>
  );
}
