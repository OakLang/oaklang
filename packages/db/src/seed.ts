import { sql } from "drizzle-orm";

import type { LanguageInsert } from "./schema";
import { db } from "./client";
import {
  accessRequestQuestionOptions,
  accessRequestQuestions,
  languages,
} from "./schema";

const seedLanguages = async () => {
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
  await db
    .insert(languages)
    .values(data)
    .onConflictDoUpdate({
      target: [languages.code],
      set: {
        name: sql`excluded.name`,
        countryCode: sql`excluded.country_code`,
      },
    });
};

const seedQuestions = async () => {
  const questions: (typeof accessRequestQuestions.$inferInsert)[] = [
    {
      id: "407c490d-0657-4080-9299-24f6c1e6e86e",
      question: "How did you find us?",
      isMultiChoice: false,
      order: 0,
    },
    {
      id: "76e6d7f3-4f45-4b8e-ab4f-57110557b8f8",
      question: "Why do you want to check out Oaklang?",
      isMultiChoice: false,
      order: 1,
    },
    {
      id: "5e328631-6ea3-4e62-8735-eb609e51958d",
      question: "How do you want to support the project?",
      isMultiChoice: false,
      order: 2,
    },
  ];
  const options: (typeof accessRequestQuestionOptions.$inferInsert)[] = [
    {
      id: "90cbc553-f686-40fa-b13e-9b52c685d6a9",
      questionId: "76e6d7f3-4f45-4b8e-ab4f-57110557b8f8",
      option: "I want to learn a language and I’m trying different things",
      order: 0,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "cea356f0-01f6-4ad9-b585-08d6fc3daec7",
      questionId: "407c490d-0657-4080-9299-24f6c1e6e86e",
      option: "I found a link on the internet",
      order: 0,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "35775ba2-3991-4a67-b533-cc9ce4779c51",
      questionId: "5e328631-6ea3-4e62-8735-eb609e51958d",
      option: "I just want to use it; you can leverage my usage stats",
      order: 0,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "5be0159d-126a-448f-be67-57a0fa42e148",
      questionId: "407c490d-0657-4080-9299-24f6c1e6e86e",
      option: "I read a blog post",
      order: 1,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "4b1cc92f-ee63-49d8-85d0-f017d451c718",
      questionId: "76e6d7f3-4f45-4b8e-ab4f-57110557b8f8",
      option:
        "I want to learn a language and what I’m doing doesn’t feel like it’s working",
      order: 1,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "22294631-7dd2-493d-b357-c1364d0f9b40",
      questionId: "5e328631-6ea3-4e62-8735-eb609e51958d",
      option: "I want to provide feedback",
      order: 1,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "8774a906-3400-48fb-a790-47ea2e44d0e3",
      questionId: "76e6d7f3-4f45-4b8e-ab4f-57110557b8f8",
      option: "Other",
      order: 2,
      isCustomAnswer: true,
      customAnswerPlaceholderText: null,
    },
    {
      id: "a02ee922-e731-4c46-84c5-21264e5e5bea",
      questionId: "407c490d-0657-4080-9299-24f6c1e6e86e",
      option: "I clicked an ad",
      order: 2,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "e5c94b4d-3b71-4dc5-9e8e-587af39d955c",
      questionId: "5e328631-6ea3-4e62-8735-eb609e51958d",
      option: "I want to help with formal testing",
      order: 2,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "3370c2a4-e7f8-4dde-bfb6-54972cc96620",
      questionId: "5e328631-6ea3-4e62-8735-eb609e51958d",
      option: "I want to help with the project (programming, logistics, etc)",
      order: 3,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "0431767f-ce01-401a-80d5-dbe716e1f9af",
      questionId: "407c490d-0657-4080-9299-24f6c1e6e86e",
      option: "Other",
      order: 3,
      isCustomAnswer: true,
      customAnswerPlaceholderText: null,
    },
    {
      id: "b1545e77-2830-44a9-837c-eedf80a2e1f4",
      questionId: "5e328631-6ea3-4e62-8735-eb609e51958d",
      option: "I am willing to be interviewed after I spend some time with it",
      order: 4,
      isCustomAnswer: false,
      customAnswerPlaceholderText: null,
    },
    {
      id: "cb461eab-5323-4037-92e1-cf55b837f889",
      questionId: "5e328631-6ea3-4e62-8735-eb609e51958d",
      option:
        "I want to provide financial support (One time and/or monthly payment options)",
      order: 5,
      isCustomAnswer: true,
      customAnswerPlaceholderText: "Enter an amount... eg. $10/mo",
    },
  ];
  await db
    .insert(accessRequestQuestions)
    .values(questions)
    .onConflictDoUpdate({
      target: accessRequestQuestions.id,
      set: {
        question: sql`excluded.question`,
        order: sql`excluded.order`,
        isMultiChoice: sql`excluded.is_multi_choice`,
      },
    });
  await db
    .insert(accessRequestQuestionOptions)
    .values(options)
    .onConflictDoUpdate({
      target: accessRequestQuestions.id,
      set: {
        option: sql`excluded.option`,
        order: sql`excluded.order`,
        customAnswerPlaceholderText: sql`excluded.custom_answer_placeholder_text`,
        isCustomAnswer: sql`excluded.is_custom_answer`,
        questionId: sql`excluded.question_id`,
      },
    });
};

const main = async () => {
  console.log("Seed start");
  await seedLanguages();
  await seedQuestions();
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
