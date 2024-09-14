import type { LanguageInsert } from "./schema";
import { db } from "./client";
import { languages } from "./schema";

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
