export interface LanguageCodeParams extends Record<string, string> {
  languageCode: string;
}

export interface TrainingSessionParams extends LanguageCodeParams {
  trainingSessionId: string;
}
