import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { protectedProcedure, router } from 'src/server/trpc';
import { z } from 'zod';
import { trainingSessionsTable, wordsTable } from '~/lib/schema';
import type { PublicTrainingSession } from '~/utils/types';
import { createTrainingSessionInput, updateTrainingSessionInput } from '~/utils/validators';

export const trainingSessionsRouter = router({
  createTrainingSession: protectedProcedure.input(createTrainingSessionInput).mutation(async (opts) => {
    const { words, ...data } = opts.input;
    const [trainingSession] = await opts.ctx.db
      .insert(trainingSessionsTable)
      .values({
        ...data,
        userId: opts.ctx.userId,
      })
      .returning();
    if (!trainingSession) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create training session' });
    }
    const dbWords = await opts.ctx.db
      .insert(wordsTable)
      .values(words.map((word) => ({ languageId: data.languageId, trainingSessionId: trainingSession.id, word })))
      .onConflictDoNothing();
    return { ...trainingSession, words: dbWords } satisfies PublicTrainingSession;
  }),
  deleteTrainingSession: protectedProcedure.input(z.string()).mutation(async (opts) => {
    const trainingSessionId = opts.input;
    const trainingSession = await opts.ctx.db.query.trainingSessionsTable.findFirst({
      where: and(eq(trainingSessionsTable.userId, opts.ctx.userId), eq(trainingSessionsTable.id, trainingSessionId)),
    });
    if (!trainingSession) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Training session not found!' });
    }
    const [deletedTrainingSession] = await opts.ctx.db
      .delete(trainingSessionsTable)
      .where(eq(trainingSessionsTable.id, trainingSession.id))
      .returning();
    if (!deletedTrainingSession) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete training session' });
    }
    return deletedTrainingSession;
  }),
  getTrainingSession: protectedProcedure.input(z.string()).query(async (opts) => {
    const trainingSessionId = opts.input;
    const trainingSession = await opts.ctx.db.query.trainingSessionsTable.findFirst({
      where: and(eq(trainingSessionsTable.userId, opts.ctx.userId), eq(trainingSessionsTable.id, trainingSessionId)),
    });
    if (!trainingSession) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Training session not found!' });
    }
    const words = await opts.ctx.db.select().from(wordsTable).where(eq(wordsTable.trainingSessionId, trainingSessionId));
    return { ...trainingSession, words } satisfies PublicTrainingSession;
  }),
  updateTrainingSession: protectedProcedure.input(updateTrainingSessionInput).mutation(async (opts) => {
    const { id: trainingSessionId, words = [], ...data } = opts.input;
    const trainingSession = await opts.ctx.db.query.trainingSessionsTable.findFirst({
      where: and(eq(trainingSessionsTable.userId, opts.ctx.userId), eq(trainingSessionsTable.id, trainingSessionId)),
    });
    if (!trainingSession) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Training session not found!' });
    }
    const [updatedTrainingSession] = await opts.ctx.db
      .update(trainingSessionsTable)
      .set(data)
      .where(eq(trainingSessionsTable.id, trainingSession.id))
      .returning();
    if (!updatedTrainingSession) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update training session' });
    }
    const existingWords = await opts.ctx.db.select().from(wordsTable).where(eq(wordsTable.trainingSessionId, trainingSessionId));
    const newWords = words.filter((word) => existingWords.findIndex((w) => w.word === word) === -1);
    const deletedWords = existingWords.filter((word) => words.findIndex((w) => w === word.word) === -1).map((word) => word.word);
    if (newWords.length > 0) {
      await opts.ctx.db
        .insert(wordsTable)
        .values(newWords.map((word) => ({ languageId: updatedTrainingSession.languageId, trainingSessionId, word })))
        .onConflictDoNothing();
    }
    if (deletedWords.length > 0) {
      await opts.ctx.db.delete(wordsTable).where(inArray(wordsTable.word, deletedWords));
    }
    const finalWords = await opts.ctx.db.select().from(wordsTable).where(eq(wordsTable.trainingSessionId, trainingSessionId));
    return { ...updatedTrainingSession, words: finalWords } satisfies PublicTrainingSession;
  }),
});
