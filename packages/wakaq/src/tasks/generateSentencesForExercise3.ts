import { z } from "zod";

import { Exercise3, Exercises } from "@acme/core/constants";
import { exercise3Data } from "@acme/db/validators";

import { wakaq } from "..";
import {
  getNativeLanguage,
  getOrThrowTrainingSession,
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

      const data = await exercise3Data.parseAsync(trainingSession.data);

      let prompt = "";

      switch (data.learnFrom) {
        case "ask-ai": {
          prompt = Exercise3.getAskAIPrompt({
            PRACTICE_LANGUAGE: practiceLanguage.name,
            NATIVE_LANGUAGE: nativeLanguage.name,
            COMPLEXITY: data.complexity,
            TOPIC: data.topic,
          });
          break;
        }
        case "content": {
          prompt = Exercise3.getContentPrompt({
            PRACTICE_LANGUAGE: practiceLanguage.name,
            NATIVE_LANGUAGE: nativeLanguage.name,
            CONTENT: data.content,
          });
          break;
        }
      }

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
