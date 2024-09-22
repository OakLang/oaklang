import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useStore } from "zustand";

import type { UpdateUserSettingsInput, UserSettings } from "@acme/db/schema";

import type { UserSettingsStore } from "~/store/user-settings-store";
import {
  createUserSettingsStore,
  initUserSettingsStore,
} from "~/store/user-settings-store";
import { api } from "~/trpc/react";

export type UserSettingsStoreApi = ReturnType<typeof createUserSettingsStore>;

export const UserSettingsStoreContext = createContext<
  UserSettingsStoreApi | undefined
>(undefined);

export interface UserSettingsStoreProviderProps {
  children: ReactNode;
  userSettings: UserSettings;
}

export default function UserSettingsStoreProvider({
  children,
  userSettings,
}: UserSettingsStoreProviderProps) {
  const storeRef = useRef<UserSettingsStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createUserSettingsStore(
      initUserSettingsStore({ userSettings }),
    );
  }

  const updateUserSettingsMut = api.userSettings.updateUserSettings.useMutation(
    {
      onMutate: () => {
        return { userSettings };
      },
      onError: (error, _, ctx) => {
        toast("Faield to change sentence Index", {
          description: error.message,
        });
        if (ctx) {
          storeRef.current?.setState((state) => ({
            ...state,
            userSettings: ctx.userSettings,
          }));
        }
      },
    },
  );

  useEffect(() => {
    if (!storeRef.current) {
      return;
    }

    const unsub = storeRef.current.subscribe((state, prevState) => {
      let updateData: UpdateUserSettingsInput = {};

      if (state.userSettings.ttsSpeed !== prevState.userSettings.ttsSpeed) {
        updateData = {
          ...updateData,
          ttsSpeed: state.userSettings.ttsSpeed,
        };
      }

      if (state.userSettings.ttsVoice !== prevState.userSettings.ttsVoice) {
        updateData = {
          ...updateData,
          ttsVoice: state.userSettings.ttsVoice,
        };
      }

      if (
        state.userSettings.autoPlayAudio !==
        prevState.userSettings.autoPlayAudio
      ) {
        updateData = {
          ...updateData,
          autoPlayAudio: state.userSettings.autoPlayAudio,
        };
      }

      if (
        JSON.stringify(state.userSettings.interlinearLines) !==
        JSON.stringify(prevState.userSettings.interlinearLines)
      ) {
        updateData = {
          ...updateData,
          interlinearLines: state.userSettings.interlinearLines,
        };
      }

      if (
        state.userSettings.nativeLanguage !==
        prevState.userSettings.nativeLanguage
      ) {
        updateData = {
          ...updateData,
          nativeLanguage: state.userSettings.nativeLanguage,
        };
      }

      if (Object.keys(updateData).length !== 0) {
        updateUserSettingsMut.mutate(updateData);
      }
    });

    return () => {
      unsub();
    };
  }, [updateUserSettingsMut]);

  return (
    <UserSettingsStoreContext.Provider value={storeRef.current}>
      {children}
    </UserSettingsStoreContext.Provider>
  );
}

export function useUserSettingsStore<T>(
  selector: (store: UserSettingsStore) => T,
): T {
  const context = useContext(UserSettingsStoreContext);

  if (!context) {
    throw new Error(
      `useUserSettingsStore must be used within UserSettingsStoreProvider`,
    );
  }

  return useStore(context, selector);
}
