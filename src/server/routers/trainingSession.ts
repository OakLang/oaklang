import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { protectedProcedure, router } from 'src/server/trpc';
import { z } from 'zod';
import { trainingSessions } from '~/lib/schema';
import { createTrainingSessionInput, updateTrainingSessionInput } from '~/utils/validators';

export const trainingSessionsRouter = router({
  createTrainingSession: protectedProcedure.input(createTrainingSessionInput).mutation(async (opts) => {
    const data = opts.input;
    const [trainingSession] = await opts.ctx.db
      .insert(trainingSessions)
      .values({
        ...data,
        userId: opts.ctx.session.user.id,
      })
      .returning();
    if (!trainingSession) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create training session' });
    }
    return trainingSession;
  }),
  deleteTrainingSession: protectedProcedure.input(z.string()).mutation(async (opts) => {
    const trainingSessionId = opts.input;
    const trainingSession = await opts.ctx.db.query.trainingSessions.findFirst({
      where: and(eq(trainingSessions.userId, opts.ctx.session.user.id), eq(trainingSessions.id, trainingSessionId)),
    });
    if (!trainingSession) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Training session not found!' });
    }
    const [deletedTrainingSession] = await opts.ctx.db
      .delete(trainingSessions)
      .where(eq(trainingSessions.id, trainingSession.id))
      .returning();
    if (!deletedTrainingSession) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete training session' });
    }
    return deletedTrainingSession;
  }),
  getTrainingSession: protectedProcedure.input(z.string()).query(async (opts) => {
    const trainingSessionId = opts.input;
    const trainingSession = await opts.ctx.db.query.trainingSessions.findFirst({
      where: and(eq(trainingSessions.userId, opts.ctx.session.user.id), eq(trainingSessions.id, trainingSessionId)),
    });
    if (!trainingSession) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Training session not found!' });
    }
    return trainingSession;
  }),
  updateTrainingSession: protectedProcedure.input(updateTrainingSessionInput).mutation(async (opts) => {
    const { id: trainingSessionId, ...data } = opts.input;
    const trainingSession = await opts.ctx.db.query.trainingSessions.findFirst({
      where: and(eq(trainingSessions.userId, opts.ctx.session.user.id), eq(trainingSessions.id, trainingSessionId)),
    });
    if (!trainingSession) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Training session not found!' });
    }
    const [updatedTrainingSession] = await opts.ctx.db
      .update(trainingSessions)
      .set(data)
      .where(eq(trainingSessions.id, trainingSession.id))
      .returning();
    if (!updatedTrainingSession) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update training session' });
    }
    return updatedTrainingSession;
  }),
});
