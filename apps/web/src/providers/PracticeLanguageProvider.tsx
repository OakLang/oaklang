"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { useParams } from "next/navigation";

import type { LanguageWithStats } from "@acme/api/validators";

import { api } from "~/trpc/react";

export interface PracticeLanguageContextValue {
  practiceLanguage: LanguageWithStats;
}

const PracticeLanguageContext =
  createContext<PracticeLanguageContextValue | null>(null);

export interface PracticeLanguageProviderProps {
  children: ReactNode;
  practiceLanguage: LanguageWithStats;
}

export default function PracticeLanguageProvider({
  children,
  practiceLanguage: language,
}: PracticeLanguageProviderProps) {
  const { practiceLanguage } = useParams<{ practiceLanguage: string }>();
  const languageQuery = api.users.getPracticeLanguage.useQuery(
    practiceLanguage,
    { initialData: language },
  );

  return (
    <PracticeLanguageContext.Provider
      value={{ practiceLanguage: languageQuery.data }}
    >
      {children}
    </PracticeLanguageContext.Provider>
  );
}

export const usePracticeLanguage = () => {
  const context = useContext(PracticeLanguageContext);
  if (!context) {
    throw new Error(
      "usePracticeLanguage must use insdie PracticeLanguageProvider",
    );
  }
  return context;
};
