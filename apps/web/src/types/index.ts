export interface LocaleParams {
  locale: string;
}

export interface PracticeLanguageParams extends LocaleParams {
  practiceLanguage: string;
}

export interface TrainingSessionParams extends PracticeLanguageParams {
  trainingSessionId: string;
}
