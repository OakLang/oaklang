import { SentencesGeneratorSettings, initialSentencesGeneratorSettings, AudioSettings, initialAudioSettings } from '@acme/validators';
import { atom } from 'jotai';

export const sentencesGeneratorSettingsAtom = atom<SentencesGeneratorSettings>(initialSentencesGeneratorSettings);

export const practiceVocabsAtom = atom<string[]>([]);

export const knownVocabsAtom = atom<string[]>([]);

export const knownIPAsAtom = atom<string[]>([]);

export const knownTranslationsAtom = atom<string[]>([]);

export const audioSettingsAtom = atom<AudioSettings>(initialAudioSettings);
