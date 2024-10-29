import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SentenceWord } from "@acme/db/schema";
import {
  EXERCISE_1_PROMPT_TEMPLATE,
  GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE,
} from "@acme/core/constants/prompt-templates";

import { storage } from "~/lib/storage";

export interface AppState {
  inspectedWord: SentenceWord | null;
  inspectionPanelOpen: boolean;
  fontSize: number;
  collectionsCollapced: Record<string, boolean>;
  playgroundPlaybackSpeed: number;
}

export interface AppActions {
  setInspectedWord: (word: SentenceWord | null) => void;
  setInspectionPanelOpen: (sidebarOpen: boolean) => void;
  setFontSize: (fontSize: number) => void;
  collapceCollection: (collectionId: string) => void;
  expandCollection: (collectionId: string) => void;
  setPlaygroundPlaybackSpeed: (speed: number) => void;
}

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      fontSize: 16,
      exercise1PromptTemplate: EXERCISE_1_PROMPT_TEMPLATE.trim(),
      overrideExercise1PromptTemplate: false,
      interlinearLinesPromptTemplate:
        GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE.trim(),
      overrideGenerateSentenceWordsPromptTemplate: false,
      inspectedWord: null,
      inspectionPanelOpen: false,
      collectionsCollapced: {},
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
    }),
    {
      name: "oaklang-state",
      storage,
      version: 0,
      migrate(persistedState, version) {
        console.log(persistedState, version);
        return persistedState;
      },
    },
  ),
);
