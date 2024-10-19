import { createStore } from "zustand/vanilla";

import type { SentenceWord } from "@acme/db/schema";
import {
  DEFAULT_GENERATE_SENTENCE_WORDS_PROMPT_TEMPLATE,
  DEFAULT_GENERATE_SENTENCES_PROMPT_TEMPLATE,
} from "@acme/core/constants";

interface AppState {
  generateSentencesPromptTemplate: string;
  generateSentenceWordsPromptTemplate: string;
  inspectedWord: SentenceWord | null;
  inspectionPanelOpen: boolean;
  fontSize: number;
}

interface AppActions {
  setGenerateSentencesPromptTemplate: (template: string) => void;
  setGenerateSentenceWordsPromptTemplate: (template: string) => void;
  setInspectedWord: (word: SentenceWord | null) => void;
  setInspectionPanelOpen: (sidebarOpen: boolean) => void;
  setFontSize: (fontSize: number) => void;
}

export type AppStore = AppState & AppActions;

export const createAppStore = (initState: AppState) => {
  return createStore<AppStore>()((set) => ({
    ...initState,
    setGenerateSentencesPromptTemplate: (generateSentencesPromptTemplate) => {
      set({ generateSentencesPromptTemplate });
      localStorage.setItem(
        "GENERATE_SENTENCES_PROMPT_TEMPLATE",
        generateSentencesPromptTemplate,
      );
    },
    setGenerateSentenceWordsPromptTemplate: (
      generateSentenceWordsPromptTemplate,
    ) => {
      set({ generateSentenceWordsPromptTemplate });
      localStorage.setItem(
        "GENERATE_SENTENCE_WORDS_PROMPT_TEMPLATE",
        generateSentenceWordsPromptTemplate,
      );
    },
    setFontSize: (fontSize) => {
      set({ fontSize });
      localStorage.setItem("font_size", String(fontSize));
    },
    setInspectedWord: (inspectedWord) => {
      set({ inspectedWord });
    },
    setInspectionPanelOpen: (inspectionPanelOpen) => {
      set({ inspectionPanelOpen });
      localStorage.setItem(
        "inspection_panel_open",
        inspectionPanelOpen ? "true" : "false",
      );
    },
  }));
};

export const initAppStore = (): AppState => {
  if (typeof window === "undefined") {
    return {
      fontSize: 16,
      generateSentencesPromptTemplate: "",
      generateSentenceWordsPromptTemplate: "",
      inspectedWord: null,
      inspectionPanelOpen: false,
    };
  }

  return {
    generateSentencesPromptTemplate:
      localStorage.getItem("GENERATE_SENTENCES_PROMPT_TEMPLATE") ??
      DEFAULT_GENERATE_SENTENCES_PROMPT_TEMPLATE.trim(),
    generateSentenceWordsPromptTemplate:
      localStorage.getItem("GENERATE_SENTENCE_WORDS_PROMPT_TEMPLATE") ??
      DEFAULT_GENERATE_SENTENCE_WORDS_PROMPT_TEMPLATE.trim(),
    inspectedWord: null,
    inspectionPanelOpen:
      localStorage.getItem("inspection_panel_open") === "true",
    fontSize: localStorage.getItem("font_size")
      ? Number(localStorage.getItem("font_size"))
      : 16,
  };
};
