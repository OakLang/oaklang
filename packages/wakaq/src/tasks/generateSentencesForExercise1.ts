import { z } from "zod";

import { Exercise1, Exercises } from "@acme/core/constants";
import { hasPowerUserAccess } from "@acme/core/helpers";
import { exercise1Data } from "@acme/core/validators";
import { and, desc, eq, isNull, not } from "@acme/db";
import { db } from "@acme/db/client";
import { sentencesTable, userWordsTable, wordsTable } from "@acme/db/schema";

import { wakaq } from "..";
import {
  getNativeLanguage,
  getOrThrowTrainingSession,
  getUserSettingsPrompts,
  handleCreateSentences,
  updateTrainingSessionStatus,
} from "../helpers";
import { generateSentences } from "../helpers/ai";
import { getPracticeWordsList } from "../helpers/words";

const Exercise = Exercises.exercise1;

export const generateSentencesForExercise1 = wakaq.task(
  async (args) => {
    const { trainingSessionId } = await z
      .object({
        trainingSessionId: z.string(),
      })
      .parseAsync(args);

    wakaq.logger?.info(
      `Running Task: generateSentencesForExercise1. Training Session Id: ${trainingSessionId}`,
    );

    const trainingSession = await getOrThrowTrainingSession(trainingSessionId);

    if (trainingSession.exercise !== Exercise) {
      wakaq.logger?.error(`Training session is not for "${Exercise}"`);
      return;
    }

    if (trainingSession.status === "pending") {
      wakaq.logger?.error("Already Pending!");
      return;
    }

    try {
      await updateTrainingSessionStatus(trainingSessionId, "pending");

      const practiceLanguage = trainingSession.language;
      const nativeLanguage = await getNativeLanguage(trainingSession.userId);
      const prompts = await getUserSettingsPrompts(trainingSession.userId);

      const data = await exercise1Data.parseAsync(trainingSession.data);

      const knownWords = await db
        .select({ word: wordsTable.word })
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(
          and(
            eq(userWordsTable.userId, trainingSession.userId),
            eq(wordsTable.languageCode, trainingSession.languageCode),
            not(isNull(userWordsTable.knownAt)),
          ),
        )
        .orderBy(desc(userWordsTable.knownAt))
        .then((res) => res.map((item) => item.word));

      let practiceWords: string[] = data.words ?? [];
      if (practiceWords.length === 0) {
        practiceWords = await getPracticeWordsList({
          wordCount: 30,
          practiceLanguage,
          knownWords,
          topic: data.topic,
          userId: trainingSession.userId,
          userEmail: trainingSession.userEmail,
        });
      }

      const previouslyGeneratedSentences = await db
        .select({
          index: sentencesTable.index,
          sentence: sentencesTable.sentence,
        })
        .from(sentencesTable)
        .where(eq(sentencesTable.trainingSessionId, trainingSession.id))
        .orderBy(desc(sentencesTable.index))
        .limit(20);

      let customPromptTemplate: string | undefined = undefined;
      if (
        hasPowerUserAccess(trainingSession.userRole) &&
        prompts["exercise-1"]?.override &&
        prompts["exercise-1"].prompt
      ) {
        customPromptTemplate = prompts["exercise-1"].prompt;
      }

      const prompt = Exercise1.getPrompt(
        {
          PRACTICE_LANGUAGE: practiceLanguage.name,
          NATIVE_LANGUAGE: nativeLanguage.name,
          PRACTICE_WORDS: practiceWords.join(", "),
          KNOWN_WORDS: knownWords.join(", "),
          PREVIOUSLY_GENERATED_SENTENCES: previouslyGeneratedSentences
            .map((item) => `${item.index}. ${item.sentence}`)
            .join(", "),
          SENTENCE_COUNT: 5,
          COMPLEXITY: data.complexity,
          TOPIC: data.topic,
        },
        customPromptTemplate,
      );

      const generatedSentences = await generateSentences({
        nativeLanguage: nativeLanguage.name,
        practiceLanguage: practiceLanguage.name,
        prompt,
        trainingSessionId,
        userEmail: trainingSession.userEmail,
        userId: trainingSession.userId,
      });

      await handleCreateSentences(trainingSession, generatedSentences);
      await updateTrainingSessionStatus(trainingSessionId, "success");
    } catch (error) {
      wakaq.logger?.error(error);
      await updateTrainingSessionStatus(trainingSessionId, "error");
    }
  },
  { name: "generateSentencesForExercise1" },
);
