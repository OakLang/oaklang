import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SentenceWord } from "@acme/db/schema";

import type { RouterInputs } from "~/trpc/react";
import { storage } from "~/lib/storage";

type OrderBy =
  RouterInputs["trainingSessions"]["getTrainingSessions"]["orderBy"];

export interface SessionsListDisplay {
  orderBy: OrderBy;
  properties: {
    title: boolean;
    createdAt: boolean;
    lastPracticedAt: boolean;
    newWordsCounter: boolean;
    knownWordsCounter: boolean;
    progress: boolean;
    language: boolean;
    exercise: boolean;
  };
}
export interface SessionsListFilter {
  exercises: string[];
}

export interface AppState {
  inspectedWord: SentenceWord | null;
  inspectionPanelOpen: boolean;
  fontSize: number;
  collectionsCollapced: Record<string, boolean>;
  playgroundPlaybackSpeed: number;
  sessionsListDisplay: SessionsListDisplay;
  sessionsListFilter: SessionsListFilter;
}

export interface AppActions {
  setInspectedWord: (word: SentenceWord | null) => void;
  setInspectionPanelOpen: (sidebarOpen: boolean) => void;
  setFontSize: (fontSize: number) => void;
  collapceCollection: (collectionId: string) => void;
  expandCollection: (collectionId: string) => void;
  setPlaygroundPlaybackSpeed: (speed: number) => void;
  setSessionsListDisplay: (options: SessionsListDisplay) => void;
  setSessionsListFilter: (options: SessionsListFilter) => void;
}

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      fontSize: 16,
      inspectedWord: null,
      inspectionPanelOpen: false,
      collectionsCollapced: {},
      sessionsListDisplay: {
        orderBy: "createdAt",
        properties: {
          title: true,
          createdAt: false,
          lastPracticedAt: true,
          knownWordsCounter: true,
          language: false,
          newWordsCounter: true,
          progress: true,
          exercise: true,
        },
      },
      sessionsListFilter: {
        exercises: [],
      },
      playgroundPlaybackSpeed: 1,
      setFontSize: (fontSize) => set({ fontSize }),
      setInspectedWord: (inspectedWord) => set({ inspectedWord }),
      setInspectionPanelOpen: (inspectionPanelOpen) =>
        set({ inspectionPanelOpen }),
      collapceCollection: (collectionId) => {
        set((state) => {
          const collectionsCollapced = { ...state.collectionsCollapced };
          collectionsCollapced[collectionId] = true;
          return { collectionsCollapced };
        });
      },
      expandCollection: (collectionId) => {
        set((state) => {
          const collectionsCollapced = { ...state.collectionsCollapced };
          collectionsCollapced[collectionId] = false;
          return { collectionsCollapced };
        });
      },
      setPlaygroundPlaybackSpeed: (playgroundPlaybackSpeed) =>
        set({ playgroundPlaybackSpeed }),
      setSessionsListDisplay: (sessionsListDisplay) =>
        set({ sessionsListDisplay }),
      setSessionsListFilter: (sessionsListFilter) =>
        set({ sessionsListFilter }),
    }),
    {
      name: "oaklang-state",
      storage,
      version: 0,
    },
  ),
);
