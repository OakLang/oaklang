import { atom } from "jotai";

import type { AudioSettings } from "@acme/validators";
import { initialAudioSettings } from "@acme/validators";

export const knownIPAsAtom = atom<string[]>([]);

export const knownTranslationsAtom = atom<string[]>([]);

export const audioSettingsAtom = atom<AudioSettings>(initialAudioSettings);

export const promptAtom =
  atom(`You are a {{PRACTICE_LANGUAGE}} tutor providing carefully constructed sentences to a student designed to help them practice the new vocabulary and grammar they are learning and exercise already known vocabulary and grammar. You thoughtfully construct sentences, stories, dialogues, and exercises that use your language naturally while using known vocabulary. 

Please provide a series of {{SENTENCE_COUNT}} sentences suitable for an {{COMPLEXITY}} {{PRACTICE_LANGUAGE}} student using as many words from the {{PRACTICE_VOCABS}} list as possible and restricting other words to those in the {{KNOWN_VOCABS}} list. Also make sure not to regenerate previously generated sentences.

PRACTICE LANGUAGE: "{{PRACTICE_LANGUAGE}}"

HELP LANGUAGE: "{{HELP_LANGUAGE}}"

PRACTICE VOCABS: "{{PRACTICE_VOCABS}}"

KNOWN VOCABS: "{{KNOWN_VOCABS}}"

PREVIOUSLY GENERATED SENTENCES: """
{{PREVIOUSLY_GENERATED_SENTENCES}}
"""`);
