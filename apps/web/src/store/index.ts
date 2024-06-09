import { atom } from 'jotai';
import { initialAudioSettings } from '~/validators/audio-settings';
import type { AudioSettings } from '~/validators/audio-settings';
import { initialSentencesGeneratorSettings } from '~/validators/settings';
import type { SentencesGeneratorSettings } from '~/validators/settings';

export const sentencesGeneratorSettingsAtom = atom<SentencesGeneratorSettings>(initialSentencesGeneratorSettings);

export const practiceVocabsAtom = atom<string[]>([]);

export const knownVocabsAtom = atom<string[]>([]);

export const knownIPAsAtom = atom<string[]>([]);

export const knownTranslationsAtom = atom<string[]>([]);

export const audioSettingsAtom = atom<AudioSettings>(initialAudioSettings);
