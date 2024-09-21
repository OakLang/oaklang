"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { UserSettings } from "@acme/db/schema";

import { api } from "~/trpc/react";

export interface UserSettingsContextValue {
  userSettings: UserSettings;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(
  null,
);

export interface UserSettingsProviderProps {
  children: ReactNode;
  userSettings: UserSettings;
}

export default function UserSettingsProvider({
  children,
  userSettings,
}: UserSettingsProviderProps) {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery(
    undefined,
    {
      initialData: userSettings,
    },
  );

  return (
    <UserSettingsContext.Provider
      value={{ userSettings: userSettingsQuery.data }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must use insdie UserSettingsProvider");
  }
  return context;
};
