import { createStore } from "zustand/vanilla";

import type { SentenceWord } from "@acme/db/schema";

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

const GENERATE_SENTENCES_PROMPT_TEMPLATE = `
You are an expert {PRACTICE_LANGUAGE} tutor specializing in creating effective practice exercises for students. Your task is to generate a set of sentences that help a student practice new vocabulary at their current proficiency level. Each sentence should:

	•	Be grammatically correct and contextually natural.
	•	Use words primarily from the PRACTICE WORDS list while limiting other vocabulary to the most relevant words from the KNOWN WORDS list.
	•	Match the student’s {COMPLEXITY} proficiency level in {PRACTICE_LANGUAGE}.
	•	Ensure variety in sentence structure, avoiding repetition of PREVIOUSLY GENERATED SENTENCES.
	•	Align with the natural flow of {PRACTICE_LANGUAGE}, while maximizing the usage of PRACTICE WORDS in a meaningful way.

Please generate {SENTENCE_COUNT} sentences based on the following constraints:

PRACTICE WORDS: {PRACTICE_WORDS}

KNOWN WORDS: {KNOWN_WORDS}

PREVIOUSLY GENERATED SENTENCES: 
{PREVIOUSLY_GENERATED_SENTENCES}
`;

const GENERATE_SENTENCE_WORDS_PROMPT_TEMPLATE = `
You are a {PRACTICE_LANGUAGE} tutor providing detailed interlinear breakdowns for individual words in a sentence. For each word in the SENTENCE below, generate the corresponding lines based on the schema.

SENTENCE: {SENTENCE}
`;

export const initAppStore = (): AppState => {
  return {
    generateSentencesPromptTemplate:
      localStorage.getItem("GENERATE_SENTENCES_PROMPT_TEMPLATE") ??
      GENERATE_SENTENCES_PROMPT_TEMPLATE.trim(),
    generateSentenceWordsPromptTemplate:
      localStorage.getItem("GENERATE_SENTENCE_WORDS_PROMPT_TEMPLATE") ??
      GENERATE_SENTENCE_WORDS_PROMPT_TEMPLATE.trim(),
    inspectedWord: null,
    inspectionPanelOpen:
      localStorage.getItem("inspection_panel_open") === "true",
    fontSize: localStorage.getItem("font_size")
      ? Number(localStorage.getItem("font_size"))
      : 16,
  };
};
