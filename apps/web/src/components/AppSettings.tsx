import * as Tabs from "@radix-ui/react-tabs";

import AIPromptsPage from "~/app/app/[languageCode]/settings/ai-prompts/page";
import LanguagesPage from "~/app/app/[languageCode]/settings/languages/page";
import PreferencesPage from "~/app/app/[languageCode]/settings/preferences/page";
import ReaderPage from "~/app/app/[languageCode]/settings/reader/page";
import { cn } from "~/utils";
import { buttonVariants } from "./ui/button";

export default function AppSettings() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Tabs.Root
        defaultValue="preferences"
        className="flex flex-1 overflow-hidden"
      >
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
            <Tabs.Trigger
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-foreground flex items-center justify-start text-left",
              )}
              value="ai-prompts"
            >
              AI Prompts
            </Tabs.Trigger>
          </Tabs.List>
        </aside>
        <div className="flex-1 overflow-y-auto">
          <Tabs.Content value="preferences">
            <PreferencesPage />
          </Tabs.Content>
          <Tabs.Content value="reader">
            <ReaderPage />
          </Tabs.Content>
          <Tabs.Content value="languages">
            <LanguagesPage />
          </Tabs.Content>
          <Tabs.Content value="ai-prompts">
            <AIPromptsPage />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
