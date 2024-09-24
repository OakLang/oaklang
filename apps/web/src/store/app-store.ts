import { createStore } from "zustand/vanilla";

interface AppState {
  promptTemplate: string;
  inspectedWordId: string | null;
  inspectionPanelOpen: boolean;
  fontSize: number;
}

interface AppActions {
  setPromptTemplate: (template: string) => void;
  setInspectedWordId: (wordId: string | null) => void;
  setInspectionPanelOpen: (sidebarOpen: boolean) => void;
  setFontSize: (fontSize: number) => void;
}

export type AppStore = AppState & AppActions;

export const createAppStore = (initState: AppState) => {
  return createStore<AppStore>()((set) => ({
    ...initState,
    setPromptTemplate: (promptTemplate) => {
      set({ promptTemplate });
      localStorage.setItem("prompt_template", promptTemplate);
    },
    setFontSize: (fontSize) => {
      set({ fontSize });
      localStorage.setItem("font_size", String(fontSize));
    },
    setInspectedWordId: (inspectedWordId) => {
      set({ inspectedWordId });
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

export const DEFAULT_PROMPT_TEMPLATE = `You are a {{PRACTICE_LANGUAGE}} tutor providing carefully constructed sentences to a student designed to help them practice the new vocabulary and grammar they are learning and exercise already known vocabulary and grammar. You thoughtfully construct sentences, stories, dialogues, and exercises that use your language naturally while using known vocabulary.

Please provide a series of {{SENTENCE_COUNT}} sentences suitable for an {{COMPLEXITY}} {{PRACTICE_LANGUAGE}} student using as many words from the PRACTICE WORDS list as possible and restricting other words to those in the KNOWN WORDS list. Also make sure not to regenerate previously generated sentences.

PRACTICE WORDS: "{{PRACTICE_WORDS}}"

KNOWN WORDS: "{{KNOWN_WORDS}}"

PREVIOUSLY GENERATED SENTENCES: """
{{PREVIOUSLY_GENERATED_SENTENCES}}
"""`;

export const initAppStore = (): AppState => {
  return {
    promptTemplate:
      localStorage.getItem("prompt_template") ?? DEFAULT_PROMPT_TEMPLATE,
    inspectedWordId: null,
    inspectionPanelOpen:
      localStorage.getItem("inspection_panel_open") === "true",
    fontSize: localStorage.getItem("font_size")
      ? Number(localStorage.getItem("font_size"))
      : 16,
  };
};
