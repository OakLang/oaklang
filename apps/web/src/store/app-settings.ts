import { atom } from "jotai";

export interface AppSettings {
  autoPlay: boolean;
}

export const initAppSettings: AppSettings = {
  autoPlay: false,
};

export const appSettingsAtom = atom(initAppSettings);
