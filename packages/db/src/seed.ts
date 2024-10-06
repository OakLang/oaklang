import { sql } from "drizzle-orm";

import type { LanguageInsert } from "./schema";
import { db } from "./client";
import {
  accessRequestQuestionOptions,
  accessRequestQuestions,
  languages,
} from "./schema";

const main = async () => {
  console.log("Seed start");

  const data: LanguageInsert[] = [
    { name: "English", code: "en", countryCode: "gb" },
    { name: "Spanish", code: "es", countryCode: "es" },
    { name: "Bulgarian", code: "bg", countryCode: "bg" },
    { name: "French", code: "fr", countryCode: "fr" },
    { name: "German", code: "de", countryCode: "de" },
    { name: "Italian", code: "it", countryCode: "it" },
    { name: "Czech", code: "cz", countryCode: "cz" },
    { name: "Ukrainian", code: "uk", countryCode: "ua" },
  ];

  const questions: (typeof accessRequestQuestions.$inferInsert & {
    options: Omit<
      typeof accessRequestQuestionOptions.$inferInsert,
      "questionId"
    >[];
  })[] = [
    {
      question: "How did you find us?",
      options: [
        { option: "I found a link on the internet" },
        { option: "I read a blog post" },
        { option: "I clicked an ad" },
        { option: "Other", isCustomAnswer: true },
      ],
    },
    {
      question: "Why do you want to check out Oaklang?",
      options: [
        {
          option: "I want to learn a language and I’m trying different things",
        },
        {
          option:
            "I want to learn a language and what I’m doing doesn’t feel like it’s working",
        },
        { option: "Other", isCustomAnswer: true },
      ],
    },
    {
      question: "How do you want to support the project?",
      options: [
        { option: "I just want to use it; you can leverage my usage stats" },
        { option: "I want to provide feedback" },
        { option: "I want to help with formal testing" },
        {
          option:
            "I want to help with the project (programming, logistics, etc)",
        },
        {
          option:
            "I am willing to be interviewed after I spend some time with it",
        },
        {
          option:
            "I want to provide financial support (One time and/or monthly payment options)",
          isCustomAnswer: true,
          customAnswerPlaceholderText: "Enter an amount... eg. $10/mo",
        },
      ],
    },
  ];

  await db.delete(languages);
  await db.insert(languages).values(data).onConflictDoNothing();
  await db.delete(accessRequestQuestions);

  await Promise.all(
    questions.map(async ({ options, ...question }, questionIndex) => {
      const [q] = await db
        .insert(accessRequestQuestions)
        .values({ ...question, order: questionIndex })
        .onConflictDoUpdate({
          target: [accessRequestQuestions.id],
          set: {
            isMultiChoice: sql`${accessRequestQuestions.isMultiChoice}`,
            order: sql`${accessRequestQuestions.order}`,
            question: sql`${accessRequestQuestions.question}`,
          },
        })
        .returning();
      if (!q) {
        throw new Error("Question not returned");
      }
      await db
        .insert(accessRequestQuestionOptions)
        .values(
          options.map((option, optionIndex) => ({
            ...option,
            order: optionIndex,
            questionId: q.id,
          })),
        )
        .onConflictDoUpdate({
          target: [accessRequestQuestionOptions.id],
          set: {
            order: sql`${accessRequestQuestionOptions.order}`,
            option: sql`${accessRequestQuestionOptions.option}`,
            isCustomAnswer: sql`${accessRequestQuestionOptions.isCustomAnswer}`,
            customAnswerPlaceholderText: sql`${accessRequestQuestionOptions.customAnswerPlaceholderText}`,
          },
        });
    }),
  );
};

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Seed done");
    process.exit(0);
  });
