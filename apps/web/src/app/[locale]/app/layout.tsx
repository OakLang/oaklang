import type { ReactNode } from "react";

import UserSettingsProvider from "~/providers/UserSettingsProvider";
import { getUserSettings } from "../../utils";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userSettings = await getUserSettings();

  return (
    <UserSettingsProvider userSettings={userSettings}>
      {children}
    </UserSettingsProvider>
  );
}
