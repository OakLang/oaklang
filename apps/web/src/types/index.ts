export interface PracticeLanguageParams extends Record<string, string> {
  practiceLanguage: string;
}

export interface TrainingSessionParams extends PracticeLanguageParams {
  trainingSessionId: string;
}
