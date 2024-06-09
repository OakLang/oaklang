import { atom } from "jotai";

export interface AppSettings {
  autoPlay: boolean;
}

export const initAppSettings: AppSettings = {
  autoPlay: true,
};

export const appSettingsAtom = atom(initAppSettings);
