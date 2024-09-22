import { createStore } from "zustand/vanilla";

import type { TrainingSession } from "@acme/db/schema";

interface TrainingSessionState {
  promptTemplate: string;
  trainingSession: TrainingSession;
  sentenceIndex: number;
  inspectedWord: string | null;
  inspectionPanelOpen: boolean;
  fontSize: number;
}

interface TrainingSessionActions {
  setPromptTemplate: (template: string) => void;
  setTrainingSession: (trainingSession: Partial<TrainingSession>) => void;
  changeSentenceIndex: (sentenceIndex: number) => void;
  setInspectedWord: (inspectedWord: string | null) => void;
  setInspectionPanelOpen: (sidebarOpen: boolean) => void;
  setFontSize: (fontSize: number) => void;
}

export type TrainingSessionStore = TrainingSessionState &
  TrainingSessionActions;

export const createTrainingSessionStore = (initState: TrainingSessionState) => {
  return createStore<TrainingSessionStore>()((set, get) => ({
    ...initState,
    setPromptTemplate: (promptTemplate) => {
      set({ promptTemplate });
      localStorage.setItem("prompt_template", promptTemplate);
    },
    setTrainingSession: (trainingSession) => {
      set({
        trainingSession: {
          ...get().trainingSession,
          ...trainingSession,
        },
      });
    },
    changeSentenceIndex: (sentenceIndex: number) => {
      set({
        sentenceIndex,
        trainingSession: {
          ...get().trainingSession,
          sentenceIndex,
        },
      });
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

export interface InitTrainingSessionStateProps {
  trainingSession: TrainingSession;
}

const DEFAULT_PROMPT_TEMPLATE = `You are a {{PRACTICE_LANGUAGE}} tutor providing carefully constructed sentences to a student designed to help them practice the new vocabulary and grammar they are learning and exercise already known vocabulary and grammar. You thoughtfully construct sentences, stories, dialogues, and exercises that use your language naturally while using known vocabulary.

Please provide a series of {{SENTENCE_COUNT}} sentences suitable for an {{COMPLEXITY}} {{PRACTICE_LANGUAGE}} student using as many words from the {{PRACTICE_VOCABS}} list as possible and restricting other words to those in the {{KNOWN_VOCABS}} list. Also make sure not to regenerate previously generated sentences.

PRACTICE LANGUAGE: "{{PRACTICE_LANGUAGE}}"

NATIVE LANGUAGE: "{{NATIVE_LANGUAGE}}"

PRACTICE VOCABS: "{{PRACTICE_VOCABS}}"

KNOWN VOCABS: "{{KNOWN_VOCABS}}"

PREVIOUSLY GENERATED SENTENCES: """
{{PREVIOUSLY_GENERATED_SENTENCES}}
"""`;

export const initTrainingSessionStore = ({
  trainingSession,
}: InitTrainingSessionStateProps): TrainingSessionState => {
  return {
    sentenceIndex: trainingSession.sentenceIndex,
    trainingSession,
    promptTemplate:
      localStorage.getItem("prompt_template") ?? DEFAULT_PROMPT_TEMPLATE,
    inspectedWord: null,
    inspectionPanelOpen:
      localStorage.getItem("inspection_panel_open") === "true",
    fontSize: localStorage.getItem("font_size")
      ? Number(localStorage.getItem("font_size"))
      : 16,
  };
};
