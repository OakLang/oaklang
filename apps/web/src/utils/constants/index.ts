export const APP_NAME = "Oaklang";

export const OnboardingRoutes = {
  nativeLanguage: "/app/onboarding/native-language",
  practiceLanguage: "/app/onboarding/practice-language",
};

export const TTS_SPEED_OPTIONS: number[] = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
];

export const AVAILABLE_PROMPT_TEMPLATE_KEYS = [
  "{{PRACTICE_LANGUAGE}}",
  "{{NATIVE_LANGUAGE}}",
  "{{PRACTICE_WORDS}}",
  "{{PREVIOUSLY_GENERATED_SENTENCES}}",
  "{{SENTENCE_COUNT}}",
  "{{COMPLEXITY}}",
];
