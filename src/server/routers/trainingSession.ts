import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { protectedProcedure, router } from 'src/server/trpc';
import { z } from 'zod';
import { trainingSessionsTable } from '~/lib/schema';
import { createTrainingSessionInput, updateTrainingSessionInput } from '~/utils/validators';

export const trainingSessionsRouter = router({
  createTrainingSession: protectedProcedure.input(createTrainingSessionInput).mutation(async (opts) => {
    const data = opts.input;
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
    return trainingSession;
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
    return trainingSession;
  }),
  updateTrainingSession: protectedProcedure.input(updateTrainingSessionInput).mutation(async (opts) => {
    const { id: trainingSessionId, ...data } = opts.input;
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
    return updatedTrainingSession;
  }),
});
