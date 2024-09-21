import { cache } from "react";

import { api } from "~/trpc/server";

export const getUserSettings = cache(api.userSettings.getUserSettings);

export const getPracticeLanguage = cache(api.languages.getPracticeLanguage);
export const getPracticeLanguages = cache(api.languages.getPracticeLanguages);

export const getTrainingSession = cache(
  api.trainingSessions.getTrainingSession,
);
export const getTrainingSessions = cache(
  api.trainingSessions.getTrainingSessions,
);
