import { atom } from "jotai";

import type {
  AudioSettings,
  SentencesGeneratorSettings,
} from "@acme/validators";
import {
  initialAudioSettings,
  initialSentencesGeneratorSettings,
} from "@acme/validators";

export const sentencesGeneratorSettingsAtom = atom<SentencesGeneratorSettings>(
  initialSentencesGeneratorSettings,
);

export const practiceVocabsAtom = atom<string[]>([]);

export const knownVocabsAtom = atom<string[]>([]);

export const knownIPAsAtom = atom<string[]>([]);

export const knownTranslationsAtom = atom<string[]>([]);

export const audioSettingsAtom = atom<AudioSettings>(initialAudioSettings);
