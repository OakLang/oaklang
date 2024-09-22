import { produce } from "immer";
import { createStore } from "zustand/vanilla";

import type { UserSettings } from "@acme/db/schema";

interface UserSettingsState {
  userSettings: UserSettings;
}

interface UserSettingsActions {
  setTtsSpeed: (ttsSpeed: number) => void;
  setTtsVoice: (ttsVoice: string) => void;
  setInterlinearLines: (
    interlinearLines: UserSettings["interlinearLines"],
  ) => void;
  setAutoPlayAudio: (autoPlayAudio: boolean) => void;
  setNativeLanguage: (nativeLanguage: string) => void;
}

export type UserSettingsStore = UserSettingsState & UserSettingsActions;

export const createUserSettingsStore = (initState: UserSettingsState) => {
  return createStore<UserSettingsStore>()((set) => ({
    ...initState,
    setTtsSpeed: (ttsSpeed) => {
      set(
        produce((state: UserSettingsStore) => {
          state.userSettings.ttsSpeed = ttsSpeed;
        }),
      );
    },
    setTtsVoice: (ttsVoice) => {
      set(
        produce((state: UserSettingsStore) => {
          state.userSettings.ttsVoice = ttsVoice;
        }),
      );
    },
    setInterlinearLines: (interlinearLines) => {
      set(
        produce((state: UserSettingsStore) => {
          state.userSettings.interlinearLines = interlinearLines;
        }),
      );
    },
    setAutoPlayAudio: (autoPlayAudio) => {
      set(
        produce((state: UserSettingsStore) => {
          state.userSettings.autoPlayAudio = autoPlayAudio;
        }),
      );
    },
    setNativeLanguage: (nativeLanguage) => {
      set(
        produce((state: UserSettingsStore) => {
          state.userSettings.nativeLanguage = nativeLanguage;
        }),
      );
    },
  }));
};

export interface InitUserSettingsStateProps {
  userSettings: UserSettings;
}

export const initUserSettingsStore = ({
  userSettings,
}: InitUserSettingsStateProps): UserSettingsState => {
  return { userSettings };
};
