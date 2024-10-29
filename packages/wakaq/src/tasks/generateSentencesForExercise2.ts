import { z } from "zod";

import { Exercise2, Exercises } from "@acme/core/constants";
import { hasPowerUserAccess } from "@acme/core/helpers";
import { exercise2Data } from "@acme/db/validators";

import { wakaq } from "..";
import {
  getNativeLanguage,
  getOrThrowTrainingSession,
  getUserSettingsPrompts,
  handleCreateSentences,
  updateTrainingSessionStatus,
} from "../helpers";
import { generateSentences } from "../helpers/ai";

const Exercise = Exercises.exercise2;

export const generateSentencesForExercise2 = wakaq.task(
  async (args) => {
    const { trainingSessionId } = await z
      .object({
        trainingSessionId: z.string(),
      })
      .parseAsync(args);

    wakaq.logger?.info(
      `Running Task: generateSentencesForExercise2. Training Session Id: ${trainingSessionId}`,
    );

    const trainingSession = await getOrThrowTrainingSession(trainingSessionId);

    if (trainingSession.exercise !== Exercise) {
      throw new Error(`Training session is not for "${Exercise}"`);
    }

    if (trainingSession.status === "pending") {
      throw new Error("Already Pending!");
    }

    if (trainingSession.status === "success") {
      throw new Error("Already success!");
    }

    try {
      await updateTrainingSessionStatus(trainingSessionId, "pending");

      const practiceLanguage = trainingSession.language;
      const nativeLanguage = await getNativeLanguage(trainingSession.userId);
      const prompts = await getUserSettingsPrompts(trainingSession.userId);

      const data = await exercise2Data.parseAsync(trainingSession.data);

      let prompt = "";

      switch (data.learnFrom) {
        case "list-of-words": {
          let customPromptTemplate: string | undefined = undefined;
          if (
            hasPowerUserAccess(trainingSession.userRole) &&
            prompts["exercise-2.list-of-words"]?.override &&
            prompts["exercise-2.list-of-words"].prompt
          ) {
            customPromptTemplate = prompts["exercise-2.list-of-words"].prompt;
          }

          prompt = Exercise2.getListOfWordsPrompt(
            {
              NATIVE_LANGUAGE: nativeLanguage.name,
              PRACTICE_LANGUAGE: practiceLanguage.name,
              COMPLEXITY: data.complexity,
              EACH_WORD_PRACTICE_COUNT: data.eachWordPracticeCount,
              WORDS: data.words.join(", "),
            },
            customPromptTemplate,
          );
          break;
        }
        case "number-of-words": {
          let customPromptTemplate: string | undefined = undefined;
          if (
            hasPowerUserAccess(trainingSession.userRole) &&
            prompts["exercise-2.number-of-words"]?.override &&
            prompts["exercise-2.number-of-words"].prompt
          ) {
            customPromptTemplate = prompts["exercise-2.number-of-words"].prompt;
          }

          prompt = Exercise2.getNumberOfWordsPrompt(
            {
              NATIVE_LANGUAGE: nativeLanguage.name,
              PRACTICE_LANGUAGE: practiceLanguage.name,
              COMPLEXITY: data.complexity,
              EACH_WORD_PRACTICE_COUNT: data.eachWordPracticeCount,
              NUMBER_OF_WORDS: data.numberOfWords,
              TOPIC: data.topic,
            },
            customPromptTemplate,
          );
          break;
        }
        case "number-of-sentences": {
          let customPromptTemplate: string | undefined = undefined;
          if (
            hasPowerUserAccess(trainingSession.userRole) &&
            prompts["exercise-2.number-of-sentences"]?.override &&
            prompts["exercise-2.number-of-sentences"].prompt
          ) {
            customPromptTemplate =
              prompts["exercise-2.number-of-sentences"].prompt;
          }

          prompt = Exercise2.getNumberOfSentencesPrompt(
            {
              NATIVE_LANGUAGE: nativeLanguage.name,
              PRACTICE_LANGUAGE: practiceLanguage.name,
              COMPLEXITY: data.complexity,
              NUMBER_OF_SENTENCES: data.numberOfSentences,
              TOPIC: data.topic,
            },
            customPromptTemplate,
          );
          break;
        }
      }

      wakaq.logger?.info(JSON.stringify({ prompt }, null, 2));

      if (!prompt) {
        await updateTrainingSessionStatus(trainingSessionId, "error");
        return;
      }

      const generatedSentences = await generateSentences({
        prompt,
        nativeLanguage: nativeLanguage.name,
        practiceLanguage: practiceLanguage.name,
        userId: trainingSession.userId,
        userEmail: trainingSession.userEmail,
        trainingSessionId: trainingSession.id,
      });

      await handleCreateSentences(trainingSession, generatedSentences);
      await updateTrainingSessionStatus(trainingSessionId, "success");
    } catch (error) {
      await updateTrainingSessionStatus(trainingSessionId, "error");
    }
  },
  { name: "generateSentencesForExercise2" },
);
