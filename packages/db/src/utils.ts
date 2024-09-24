import crypto from "crypto";
import ksuid from "ksuid";

import type { InterlinearLine } from "@acme/core/validators";

export const createPrefixedId = (prefix: string) => {
  const id = ksuid.fromParts(Date.now(), crypto.randomBytes(16));
  return `${prefix}_${id.string}`;
};

export const getDefaultInterlinearLines = (): InterlinearLine[] => [
  {
    id: createPrefixedId("inter"),
    name: "text",
    style: { fontFamily: "Times New Roman" },
    description:
      "whitespace delimited text associated with word from the full sentence including capitalization and punctuation",
    disappearing: "default",
    hidden: false,
  },
  {
    id: createPrefixedId("inter"),
    name: "word",
    style: { fontFamily: "Times New Roman", fontWeight: "500" },
    description:
      "word in {{PRACTICE_LANGUAGE}} without whitespace or punctuation or capitalization",
    disappearing: "default",
    hidden: false,
  },
  {
    id: createPrefixedId("inter"),
    name: "lemma",
    style: { fontFamily: "Times New Roman" },
    description: "word in lemma form",
    disappearing: "default",
    hidden: false,
  },
  {
    id: createPrefixedId("inter"),
    name: "translation",
    style: { fontFamily: "Times New Roman" },
    description: "word translation in {{NATIVE_LANGUAGE}}",
    disappearing: "default",
    hidden: false,
  },
  {
    id: createPrefixedId("inter"),
    name: "ipa",
    style: { fontFamily: "Times New Roman" },
    description: "word pronunciation in IPA format",
    disappearing: "default",
    hidden: false,
  },
  {
    id: createPrefixedId("inter"),
    name: "pronunciation",
    style: { fontFamily: "Times New Roman" },
    description: "phonetic word pronunciation in {{NATIVE_LANGUAGE}}",
    disappearing: "default",
    hidden: false,
  },
  {
    id: createPrefixedId("inter"),
    name: "grammar",
    style: { fontStyle: "italic" },
    description:
      "Provide an abbreviated grammatical analysis of the word in this context using standard grammatical abbreviations (e.g., adj m s nom), including part of speech, gender, number, case, tense, and other relevant details.",
    disappearing: "default",
    hidden: true,
  },
];
