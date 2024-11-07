"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { RouterOutputs } from "~/trpc/react";
import RenderQueryResult from "~/components/RenderQueryResult";
import { api } from "~/trpc/react";

export interface PracticeLanguageContextValue {
  language: RouterOutputs["languages"]["getPracticeLanguage"];
}

export const PracticeLanguageContext =
  createContext<PracticeLanguageContextValue | null>(null);

export interface PracticeLanguageProviderProps {
  languageCode: string;
  children: ReactNode;
}

export default function PracticeLanguageProvider({
  languageCode,
  children,
}: PracticeLanguageProviderProps) {
  const practiceLanguageQuery = api.languages.getPracticeLanguage.useQuery({
    languageCode,
  });

  return (
    <RenderQueryResult query={practiceLanguageQuery}>
      {(query) => (
        <PracticeLanguageContext.Provider value={{ language: query.data }}>
          {children}
        </PracticeLanguageContext.Provider>
      )}
    </RenderQueryResult>
  );
}

export function usePracticeLanguage() {
  const context = useContext(PracticeLanguageContext);
  if (!context) {
    throw new Error(
      "usePracticeLanguage must use inside a PracticeLanguageProvider.",
    );
  }
  return context;
}
