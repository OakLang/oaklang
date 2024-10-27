import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SentenceWord } from "@acme/db/schema";
import {
  EXERCISE_1_PROMPT_TEMPLATE,
  GENERATE_INTERLINEAR_LINES_FOR_SENTENCE_PROMPT_TEMPLATE,
} from "@acme/core/constants/prompt-templates";

import { storage } from "~/lib/storage";

export interface AppState {
  exercise1PromptTemplate: string;
  overrideExercise1PromptTemplate: boolean;
  interlinearLinesPromptTemplate: string;
  overrideGenerateSentenceWordsPromptTemplate: boolean;
  inspectedWord: SentenceWord | null;
  inspectionPanelOpen: boolean;
  fontSize: number;
  collectionsCollapced: Record<string, boolean>;
  playgroundPlaybackSpeed: number;
}

export interface AppActions {
  setExercise1PromptTemplate: (template: string, override?: boolean) => void;
  setInterlinearLinesPromptTemplate: (
    template: string,
    override?: boolean,
  ) => void;
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
      setExercise1PromptTemplate: (exercise1PromptTemplate, override = true) =>
        set({
          exercise1PromptTemplate,
          overrideExercise1PromptTemplate: override,
        }),
      setInterlinearLinesPromptTemplate: (
        interlinearLinesPromptTemplate,
        override = true,
      ) =>
        set({
          interlinearLinesPromptTemplate,
          overrideGenerateSentenceWordsPromptTemplate: override,
        }),
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
