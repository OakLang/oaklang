import type { LanguageInsert } from "./schema";
import { db } from "./client";
import { languages } from "./schema";

const main = async () => {
  console.log("Seed start");

  const data: LanguageInsert[] = [
    { name: "English", code: "en" },
    { name: "Spanish", code: "es" },
    { name: "Bulgarian", code: "bg" },
    { name: "French", code: "fr" },
    { name: "German", code: "de" },
    { name: "Italian", code: "it" },
    { name: "Czech", code: "cs" },
  ];

  await db.delete(languages);
  await db.insert(languages).values(data);
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
