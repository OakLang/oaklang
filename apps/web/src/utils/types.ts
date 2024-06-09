import type { TrainingSession, Lexicon } from '~/lib/schema';

export interface PublicTrainingSession extends TrainingSession {
  lexicons: Lexicon[];
}
