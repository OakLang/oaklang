import { atom } from 'jotai';

export type AppSettings = {
  autoPlay: boolean;
};

export const initAppSettings: AppSettings = {
  autoPlay: true,
};

export const appSettingsAtom = atom(initAppSettings);
