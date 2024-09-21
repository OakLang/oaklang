"use client";

import { useTheme } from "next-themes";

import PageTitle from "~/components/PageTitle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle title="Preferences" description="Manage your preferences" />

      <Separator className="my-8" />

      <div className="my-8">
        <h2 className="mb-4 text-xl font-medium">General</h2>
        <div className="flex items-center">
          <div className="flex-1">
            <p>Theme</p>
          </div>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "light", name: "Light" },
                { value: "dark", name: "Dark" },
                { value: "system", name: "System" },
              ].map((item) => (
                <SelectItem value={item.value} key={item.value}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
