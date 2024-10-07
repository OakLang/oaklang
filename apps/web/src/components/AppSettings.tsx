import { useParams } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";

import type { PracticeLanguageParams } from "~/types";
import LanguagesPage from "~/app/app/[practiceLanguage]/settings/languages/page";
import PreferencesPage from "~/app/app/[practiceLanguage]/settings/preferences/page";
import ReaderPage from "~/app/app/[practiceLanguage]/settings/reader/page";
import { cn } from "~/utils";
import { buttonVariants } from "./ui/button";

export default function AppSettings() {
  const params = useParams<PracticeLanguageParams>();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex h-16 flex-shrink-0 items-center border-b px-4">
        <p className="text-lg font-semibold">App Settings</p>
      </div>
      <Tabs.Root className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r">
          <Tabs.List className="grid h-fit w-full gap-1 bg-transparent p-4">
            <Tabs.Trigger
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-foreground flex items-center justify-start text-left",
              )}
              value="preferences"
            >
              Preferences
            </Tabs.Trigger>
            <Tabs.Trigger
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-foreground flex items-center justify-start text-left",
              )}
              value="reader"
            >
              Reader
            </Tabs.Trigger>
            <Tabs.Trigger
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-foreground flex items-center justify-start text-left",
              )}
              value="languages"
            >
              Languages
            </Tabs.Trigger>
          </Tabs.List>
        </aside>
        <div className="flex-1 overflow-y-auto">
          <Tabs.Content value="preferences">
            <PreferencesPage params={params} />
          </Tabs.Content>
          <Tabs.Content value="reader">
            <ReaderPage params={params} />
          </Tabs.Content>
          <Tabs.Content value="languages">
            <LanguagesPage params={params} />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
