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
    name: "word",
    description: "word in PRACTICE LANGUAGE",
    disappearing: "default",
    hidden: false,
    style: {
      fontFamily: "Times New Roman",
      fontWeight: "500",
    },
  },
  {
    id: createPrefixedId("inter"),
    name: "ipa",
    description: "word pronunciation in IPA format",
    disappearing: "default",
    hidden: false,
    style: {
      fontFamily: "Times New Roman",
    },
  },
  {
    id: createPrefixedId("inter"),
    name: "pronunciation",
    description: "phonetic word pronunciation in HELP LANGUAGE",
    disappearing: "default",
    hidden: false,
    style: {
      fontFamily: "Times New Roman",
    },
  },
  {
    id: createPrefixedId("inter"),
    name: "lemma",
    description: "word in lemma form",
    disappearing: "default",
    hidden: false,
    style: {
      fontFamily: "Times New Roman",
    },
  },
  {
    id: createPrefixedId("inter"),
    name: "translation",
    description: "word translation in HELP LANGUAGE",
    disappearing: "default",
    hidden: false,
    style: {
      fontFamily: "Times New Roman",
    },
  },
  {
    id: createPrefixedId("inter"),
    name: "text",
    description:
      "whitespace delimeted text associated with word from the full sentence including capitalization and punctuatio",
    disappearing: "default",
    hidden: false,
    style: {
      fontFamily: "Times New Roman",
    },
  },
];
