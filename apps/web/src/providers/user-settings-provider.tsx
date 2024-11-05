"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { toast } from "sonner";

import type { InterlinearLine } from "@acme/core/validators";
import type { UserSettings } from "@acme/db/schema";

import { api } from "~/trpc/react";

export interface UserSettingsContextValue {
  userSettings: UserSettings;
  updateUserSettings: ReturnType<
    typeof api.userSettings.updateUserSettings.useMutation
  >;
}

export const UserSettingsContext =
  createContext<UserSettingsContextValue | null>(null);

export default function UserSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [userSettings] = api.userSettings.getUserSettings.useSuspenseQuery();

  const utils = api.useUtils();

  const updateUserSettings = api.userSettings.updateUserSettings.useMutation({
    onMutate: ({ interlinearLines, ...vars }) => {
      const oldData = utils.userSettings.getUserSettings.getData();
      if (oldData) {
        utils.userSettings.getUserSettings.setData(undefined, {
          ...oldData,
          ...vars,
          interlinearLines: interlinearLines
            ? (interlinearLines as InterlinearLine[])
            : oldData.interlinearLines,
        });
      }
      return { oldData };
    },
    onError: (error, _, ctx) => {
      toast("Failed to update user settings", { description: error.message });
      if (ctx?.oldData) {
        utils.userSettings.getUserSettings.setData(undefined, ctx.oldData);
      } else {
        void utils.userSettings.getUserSettings.invalidate();
      }
    },
  });

  return (
    <UserSettingsContext.Provider value={{ userSettings, updateUserSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error(
      "useUserSettings context must use inside UserSettingsProvider",
    );
  }
  return context;
}
