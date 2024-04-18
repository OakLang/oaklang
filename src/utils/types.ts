import type { TrainingSession, Word } from '~/lib/schema';

export interface PublicTrainingSession extends TrainingSession {
  words: Word[];
}
