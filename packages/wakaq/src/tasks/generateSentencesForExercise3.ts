import { z } from "zod";

import { Exercise3, Exercises } from "@acme/core/constants";
import { hasPowerUserAccess } from "@acme/core/helpers";
import { exercise3Data } from "@acme/core/validators";

import { wakaq } from "..";
import {
  getNativeLanguage,
  getOrThrowTrainingSession,
  getUserSettingsPrompts,
  handleCreateSentences,
  updateTrainingSessionStatus,
} from "../helpers";
import { generateSentences } from "../helpers/ai";

const Exercise = Exercises.exercise3;

export const generateSentencesForExercise3 = wakaq.task(
  async (args) => {
    const { trainingSessionId } = await z
      .object({
        trainingSessionId: z.string(),
      })
      .parseAsync(args);

    wakaq.logger?.info(
      `Running Task: generateSentencesForExercise3. Training Session Id: ${trainingSessionId}`,
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

      const data = await exercise3Data.parseAsync(trainingSession.data);

      let prompt = "";

      switch (data.learnFrom) {
        case "ask-ai": {
          let customPromptTemplate: string | undefined = undefined;
          if (
            hasPowerUserAccess(trainingSession.userRole) &&
            prompts["exercise-3.ask-ai"]?.override &&
            prompts["exercise-3.ask-ai"].prompt
          ) {
            customPromptTemplate = prompts["exercise-3.ask-ai"].prompt;
          }

          prompt = Exercise3.getAskAIPrompt(
            {
              PRACTICE_LANGUAGE: practiceLanguage.name,
              NATIVE_LANGUAGE: nativeLanguage.name,
              COMPLEXITY: data.complexity,
              TOPIC: data.topic,
            },
            customPromptTemplate,
          );
          break;
        }
        case "content": {
          let customPromptTemplate: string | undefined = undefined;
          if (
            hasPowerUserAccess(trainingSession.userRole) &&
            prompts["exercise-3.content"]?.override &&
            prompts["exercise-3.content"].prompt
          ) {
            customPromptTemplate = prompts["exercise-3.content"].prompt;
          }

          prompt = Exercise3.getContentPrompt(
            {
              PRACTICE_LANGUAGE: practiceLanguage.name,
              NATIVE_LANGUAGE: nativeLanguage.name,
              CONTENT: data.content,
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
  { name: "generateSentencesForExercise3" },
);
