import type { UserSettings } from "@acme/db/schema";

export type UserSettingsState = UserSettings;

export interface UserSettingsActions {
  changeTTSSeed: (ttsSpeed: number) => void;
  changeTTSVoice: (ttsVoice: string) => void;
}
