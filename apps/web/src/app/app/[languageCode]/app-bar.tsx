import PracticeLanguageSwitcher from "~/components/PracticeLanguageSwitcher";
import PrefetchLink from "~/components/PrefetchLink";
import { ThemeToggle } from "~/components/ThemeToggle";
import UserButton from "~/components/UserButton";

export default function AppBar({ languageCode }: { languageCode: string }) {
  return (
    <header className="bg-card text-card-foreground sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center gap-2 px-4">
        <h1 className="text-lg font-semibold">
          <PrefetchLink href={`/app/${languageCode}`}>Oaklang</PrefetchLink>
        </h1>
        <div className="flex-1" />
        <PracticeLanguageSwitcher practiceLanguageCode={languageCode} />
        <ThemeToggle />
        <UserButton languageCode={languageCode} />
      </div>
    </header>
  );
}
