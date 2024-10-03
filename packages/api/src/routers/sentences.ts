import type { LanguageModelV1 } from "ai";
import type { ZodString } from "zod";
import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import type { Session } from "@acme/auth";
import type { Language, TrainingSession, UserSettings } from "@acme/db/schema";
import {
  and,
  asc,
  createSelectSchema,
  desc,
  eq,
  isNull,
  lte,
  not,
  or,
  sql,
} from "@acme/db";
import { db } from "@acme/db/client";
import {
  languages,
  sentences,
  sentenceWords,
  userWords,
  words,
} from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getOrCreateWord,
  getTrainingSessionOrThrow,
  getUserSettings,
} from "../utils";

const getMoreWordsPrompt = ({
  practiceLanguage,
  wordCount,
  topic,
  currentWords,
}: {
  topic?: string;
  wordCount: number;
  practiceLanguage: string;
  currentWords: string[];
}) => {
  return stringTemplate(
    topic
      ? "Give me a list of {WORD_COUNT} common words from {PRACTICE_LANGUAGE} language in lemma form related to the topic below. Also do not provide any word from the CURRENT WORDS list.\n\nTOPIC: {TOPIC}\nCURRENT WORDS: {CURRENT_WORDS}"
      : "Give me a list of {WORD_COUNT} common words from {PRACTICE_LANGUAGE} language in lemma form..  Also do not provide any word from the CURRENT WORDS list.\nCURRENT WORDS: {CURRENT_WORDS}",
    {
      WORD_COUNT: wordCount,
      PRACTICE_LANGUAGE: practiceLanguage,
      TOPIC: topic,
      CURRENT_WORDS: currentWords.join(", "),
    },
  );
};

const pickReleventWordsForATopic = ({
  topic,
  words,
  wordCount,
}: {
  topic: string;
  words: string[];
  wordCount: number;
}) => {
  return stringTemplate(
    "Pick maximum {WORD_COUNT} words form the WORDS list below which are related to the TOPIC. Do not pick any other words which are not in the WORDS list below.\n\nWORDS: {WORDS}\n\nTOPIC: {TOPIC}",
    {
      WORDS: words.join(", "),
      TOPIC: topic,
      WORD_COUNT: wordCount,
    },
  );
};

export const sentencesRouter = createTRPCRouter({
  getSentences: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .output(z.array(createSelectSchema(sentences)))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        trainingSessionId,
        db,
        session,
      );
      return db
        .select()
        .from(sentences)
        .where(eq(sentences.trainingSessionId, trainingSession.id))
        .orderBy(asc(sentences.index));
    }),
  getSentence: protectedProcedure
    .input(z.object({ sentenceId: z.string() }))
    .query(async ({ ctx: { db, session }, input: { sentenceId } }) => {
      const [sentence] = await db
        .select()
        .from(sentences)
        .where(eq(sentences.id, sentenceId));

      if (!sentence) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sentence not found!",
        });
      }

      await getTrainingSessionOrThrow(sentence.trainingSessionId, db, session);

      return sentence;
    }),
  generateSentences: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        limit: z.number().min(1).max(10).default(5),
        promptTemplate: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const userSettings = await getUserSettings(session.user.id, db);
      if (!userSettings.nativeLanguage) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User do not have native language",
        });
      }

      const PRACTICE_WORDS_COUNT = 30;

      const [nativeLanguage] = await db
        .select()
        .from(languages)
        .where(eq(languages.code, userSettings.nativeLanguage));
      if (!nativeLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Native language not found!",
        });
      }

      const trainingSession = await getTrainingSessionOrThrow(
        input.trainingSessionId,
        db,
        session,
      );
      const [practiceLanguage] = await db
        .select()
        .from(languages)
        .where(eq(languages.code, trainingSession.languageCode));
      if (!practiceLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice Language not found!",
        });
      }

      const model = openai("gpt-4o", { user: session.user.id });

      const knownWords = await db
        .select({ word: words.word })
        .from(userWords)
        .innerJoin(words, eq(words.id, userWords.wordId))
        .where(
          and(
            eq(userWords.userId, session.user.id),
            eq(words.languageCode, practiceLanguage.code),
            not(isNull(userWords.knownAt)),
          ),
        )
        .orderBy(desc(userWords.knownAt))
        .then((res) => res.map((item) => item.word));

      const practiceWordsList = await getPracticeWordsList({
        session,
        trainingSession,
        PRACTICE_WORDS_COUNT,
        practiceLanguage,
        model,
        knownWords,
      });

      const previouslyGeneratedSentences = await db
        .select({ index: sentences.index, sentence: sentences.sentence })
        .from(sentences)
        .where(eq(sentences.trainingSessionId, trainingSession.id))
        .orderBy(asc(sentences.index));

      const TEMPLATE_OBJECT = {
        SENTENCE_COUNT: input.limit,
        PRACTICE_LANGUAGE: practiceLanguage.name,
        NATIVE_LANGUAGE: nativeLanguage.name,
        PRACTICE_WORDS: practiceWordsList.join(", "),
        KNOWN_WORDS: knownWords.join(", "),
        COMPLEXITY: trainingSession.complexity,
        PREVIOUSLY_GENERATED_SENTENCES: previouslyGeneratedSentences
          .map((sen) => `${sen.index}. ${sen.sentence}`)
          .join("\n"),
        TOPIC: trainingSession.topic?.trim(),
      };

      const sentenceGeneratorPrompt = stringTemplate(
        input.promptTemplate,
        TEMPLATE_OBJECT,
      );

      console.log("SENTENCE GENERATOR PROMPT: ", sentenceGeneratorPrompt);

      const schema = z.object({
        sentences: z.array(
          z.object({
            sentence: z
              .string()
              .describe(
                stringTemplate(
                  "The full sentence in {PRACTICE_LANGUAGE} language.",
                  TEMPLATE_OBJECT,
                ),
              ),
            translation: z
              .string()
              .describe(
                stringTemplate(
                  "The full sentence translation in {NATIVE_LANGUAGE}",
                  TEMPLATE_OBJECT,
                ),
              ),
          }),
        ),
      });

      const result = await generateObject({
        model,
        prompt: sentenceGeneratorPrompt,
        schema,
      });

      const validatedSentences = result.object.sentences;

      const lastSentenceIndex = previouslyGeneratedSentences.at(-1)?.index ?? 0;
      console.log("Last sentence index: ", lastSentenceIndex);

      const newSentences = await db
        .insert(sentences)
        .values(
          validatedSentences.map((sentence, index) => ({
            index: lastSentenceIndex + 1 + index,
            sentence: sentence.sentence,
            translation: sentence.translation,
            trainingSessionId: trainingSession.id,
          })),
        )
        .returning();

      return {
        sentences: newSentences.sort((a, b) => a.index - b.index),
        prompt: sentenceGeneratorPrompt,
      };
    }),
  getSentenceWords: protectedProcedure
    .input(z.object({ sentenceId: z.string(), promptTemplate: z.string() }))
    .output(
      z.array(
        createSelectSchema(sentenceWords, {
          interlinearLines: z.object({}).catchall(z.string()),
        }).extend({
          userWord: createSelectSchema(userWords).nullable(),
          word: createSelectSchema(words),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const list = await db
        .select()
        .from(sentenceWords)
        .innerJoin(words, eq(words.id, sentenceWords.wordId))
        .leftJoin(userWords, eq(userWords.wordId, sentenceWords.wordId))
        .where(eq(sentenceWords.sentenceId, input.sentenceId))
        .orderBy(asc(sentenceWords.index));

      if (list.length > 0) {
        return list.map((item) => ({
          ...item.sentence_word,
          userWord: item.user_word,
          word: item.word,
        }));
      }

      const [sentence] = await db
        .select()
        .from(sentences)
        .where(eq(sentences.id, input.sentenceId));
      if (!sentence) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sentence not found!",
        });
      }

      const userSettings = await getUserSettings(ctx.session.user.id, db);
      if (!userSettings.nativeLanguage) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User do not have native language",
        });
      }

      const [nativeLanguage] = await db
        .select()
        .from(languages)
        .where(eq(languages.code, userSettings.nativeLanguage));
      if (!nativeLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Native language not found!",
        });
      }

      const trainingSession = await getTrainingSessionOrThrow(
        sentence.trainingSessionId,
        ctx.db,
        ctx.session,
      );
      const [practiceLanguage] = await db
        .select()
        .from(languages)
        .where(eq(languages.code, trainingSession.languageCode));
      if (!practiceLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice Language not found!",
        });
      }

      const prompt = stringTemplate(input.promptTemplate, {
        PRACTICE_LANGUAGE: practiceLanguage.name,
        NATIVE_LANGUAGE: nativeLanguage.name,
        SENTENCE: sentence.sentence,
      });

      console.log("Interlinear Lines Generation Prompt", prompt);
      const schema = buildSentenceWordsGPTSchema({
        nativeLanguage,
        practiceLanguage,
        userSettings,
      });

      const result = await generateObject({
        model: openai("gpt-4o", { user: ctx.session.user.id }),
        prompt,
        schema,
      });

      console.log("GPT Generated interlinear word lines", result.object.words);

      const filterdWords = result.object.words as unknown as {
        word: string;
        lemma: string;
        text: string;
        [x: string]: string;
      }[];

      console.log({ filterdWords });

      const newList = await Promise.all(
        filterdWords.map(async (item, index) => {
          const primaryWord = item.lemma;
          const word = await getOrCreateWord(
            primaryWord,
            practiceLanguage.code,
            db,
          );
          const [userWord] = await db
            .select()
            .from(userWords)
            .where(
              and(
                eq(userWords.userId, ctx.session.user.id),
                eq(userWords.wordId, word.id),
              ),
            );

          const [sentenceWord] = await db
            .insert(sentenceWords)
            .values({
              interlinearLines: item,
              index,
              sentenceId: sentence.id,
              wordId: word.id,
            })
            .returning();
          if (!sentenceWord) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          }
          return { sentenceWord, word, userWord };
        }),
      );

      return newList
        .map((item) => ({
          ...item.sentenceWord,
          word: item.word,
          userWord: item.userWord ?? null,
        }))
        .sort((a, b) => a.index - b.index);
    }),
});

const buildSentenceWordsGPTSchema = ({
  nativeLanguage,
  practiceLanguage,
  userSettings,
}: {
  userSettings: UserSettings;
  nativeLanguage: Language;
  practiceLanguage: Language;
}) => {
  const wordSchema: Record<string, ZodString> = {};
  userSettings.interlinearLines.forEach((line) => {
    if (line.name && line.description) {
      wordSchema[line.name] = z.string().describe(
        stringTemplate(line.description, {
          PRACTICE_LANGUAGE: practiceLanguage.name,
          NATIVE_LANGUAGE: nativeLanguage.name,
        }),
      );
    }
  });

  return z.object({
    words: z.array(z.object(wordSchema)),
  });
};

const getPracticeWordsList = async ({
  session,
  trainingSession,
  PRACTICE_WORDS_COUNT,
  practiceLanguage,
  model,
  knownWords,
}: {
  model: LanguageModelV1;
  trainingSession: TrainingSession;
  session: Session;
  PRACTICE_WORDS_COUNT: number;
  practiceLanguage: Language;
  knownWords: string[];
}): Promise<string[]> => {
  const currentPracticeWordsList = await db
    .select({ word: words.word })
    .from(userWords)
    .innerJoin(words, eq(words.id, userWords.wordId))
    .where(
      and(
        eq(userWords.userId, session.user.id),
        eq(words.languageCode, trainingSession.languageCode),
        isNull(userWords.knownAt),
        or(
          isNull(userWords.nextPracticeAt),
          lte(userWords.nextPracticeAt, sql`NOW()`),
        ),
      ),
    )
    .orderBy(desc(userWords.seenCount));

  let practiceWordsList: string[] = [];

  if (trainingSession.topic && currentPracticeWordsList.length > 0) {
    const _prompt = pickReleventWordsForATopic({
      topic: trainingSession.topic,
      wordCount: PRACTICE_WORDS_COUNT,
      words: currentPracticeWordsList.map((word) => word.word),
    });
    console.log("Pick Words Prompt", _prompt);
    const pickedWords = await generateObject({
      model,
      schema: z.object({
        words: z.array(z.string()).describe("list of picked words"),
      }),
      prompt: _prompt,
    });
    practiceWordsList = pickedWords.object.words;
  } else {
    practiceWordsList = currentPracticeWordsList
      .map((word) => word.word)
      .slice(0, PRACTICE_WORDS_COUNT);
  }

  console.log("PICKED PRACTICE WORDS: ", practiceWordsList);

  if (practiceWordsList.length < PRACTICE_WORDS_COUNT) {
    const NEW_WORD_COUNT = PRACTICE_WORDS_COUNT - practiceWordsList.length;
    const _prompt = getMoreWordsPrompt({
      wordCount: NEW_WORD_COUNT,
      practiceLanguage: practiceLanguage.name,
      topic: trainingSession.topic?.trim(),
      currentWords: [...practiceWordsList, ...knownWords],
    });

    console.log("More Words Prompt", _prompt);

    const _result = await generateObject({
      model,
      schema: z.object({
        words: z.array(z.string()).describe("list of words in lemma form"),
      }),
      prompt: _prompt,
    });

    const newWords = await Promise.all(
      _result.object.words.map((word) =>
        getOrCreateWord(word, trainingSession.languageCode, db),
      ),
    );

    await db
      .insert(userWords)
      .values(
        newWords.map(
          (word) =>
            ({
              wordId: word.id,
              userId: session.user.id,
            }) satisfies typeof userWords.$inferInsert,
        ),
      )
      .onConflictDoNothing();

    console.log(
      "NEW WORDS",
      newWords.map((word) => word.word),
    );
    practiceWordsList = [
      ...new Set([...practiceWordsList, ...newWords.map((word) => word.word)]),
    ];
  }

  console.log("Final Practice Words", practiceWordsList);

  return practiceWordsList;
};
