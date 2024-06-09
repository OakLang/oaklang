// import { TRPCError } from '@trpc/server';
// import { and, eq, inArray } from 'drizzle-orm';
// import { protectedProcedure, router } from 'src/server/trpc';
// import { z } from 'zod';
// import { trainingSessionsTable, lexiconsTable } from '~/lib/schema';
// import type { PublicTrainingSession } from '~/utils/types';
// import { createTrainingSessionInput, updateTrainingSessionInput } from '~/utils/validators';

import { createTRPCRouter } from "../trpc";

export const trainingSessionsRouter = createTRPCRouter({
  //   createTrainingSession: protectedProcedure.input(createTrainingSessionInput).mutation(async (opts) => {
  //     const { lexicons, ...data } = opts.input;
  //     const [trainingSession] = await opts.ctx.db
  //       .insert(trainingSessionsTable)
  //       .values({
  //         ...data,
  //         userId: opts.ctx.userId,
  //       })
  //       .returning();
  //     if (!trainingSession) {
  //       throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create training session' });
  //     }
  //     const dbLexicons = await opts.ctx.db
  //       .insert(lexiconsTable)
  //       .values(lexicons.map((lexicon) => ({ languageId: data.languageId, lexicon, trainingSessionId: trainingSession.id })))
  //       .onConflictDoNothing();
  //     return { ...trainingSession, lexicons: dbLexicons } satisfies PublicTrainingSession;
  //   }),
  //   deleteTrainingSession: protectedProcedure.input(z.string()).mutation(async (opts) => {
  //     const trainingSessionId = opts.input;
  //     const trainingSession = await opts.ctx.db.query.trainingSessionsTable.findFirst({
  //       where: and(eq(trainingSessionsTable.userId, opts.ctx.userId), eq(trainingSessionsTable.id, trainingSessionId)),
  //     });
  //     if (!trainingSession) {
  //       throw new TRPCError({ code: 'NOT_FOUND', message: 'Training session not found!' });
  //     }
  //     const [deletedTrainingSession] = await opts.ctx.db
  //       .delete(trainingSessionsTable)
  //       .where(eq(trainingSessionsTable.id, trainingSession.id))
  //       .returning();
  //     if (!deletedTrainingSession) {
  //       throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete training session' });
  //     }
  //     return deletedTrainingSession;
  //   }),
  //   getCurrentUserTrainingSessions: protectedProcedure.query(async (opts) => {
  //     const sessions = await opts.ctx.db.query.trainingSessionsTable.findMany({
  //       where: eq(trainingSessionsTable.userId, opts.ctx.userId),
  //     });
  //     return sessions;
  //   }),
  //   getTrainingSession: protectedProcedure.input(z.string()).query(async (opts) => {
  //     const trainingSessionId = opts.input;
  //     const trainingSession = await opts.ctx.db.query.trainingSessionsTable.findFirst({
  //       where: and(eq(trainingSessionsTable.userId, opts.ctx.userId), eq(trainingSessionsTable.id, trainingSessionId)),
  //     });
  //     if (!trainingSession) {
  //       throw new TRPCError({ code: 'NOT_FOUND', message: 'Training session not found!' });
  //     }
  //     const lexicons = await opts.ctx.db.select().from(lexiconsTable).where(eq(lexiconsTable.trainingSessionId, trainingSessionId));
  //     return { ...trainingSession, lexicons } satisfies PublicTrainingSession;
  //   }),
  //   updateTrainingSession: protectedProcedure.input(updateTrainingSessionInput).mutation(async (opts) => {
  //     const { id: trainingSessionId, lexicons = [], ...data } = opts.input;
  //     const trainingSession = await opts.ctx.db.query.trainingSessionsTable.findFirst({
  //       where: and(eq(trainingSessionsTable.userId, opts.ctx.userId), eq(trainingSessionsTable.id, trainingSessionId)),
  //     });
  //     if (!trainingSession) {
  //       throw new TRPCError({ code: 'NOT_FOUND', message: 'Training session not found!' });
  //     }
  //     const [updatedTrainingSession] = await opts.ctx.db
  //       .update(trainingSessionsTable)
  //       .set(data)
  //       .where(eq(trainingSessionsTable.id, trainingSession.id))
  //       .returning();
  //     if (!updatedTrainingSession) {
  //       throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update training session' });
  //     }
  //     const existingLexicons = await opts.ctx.db.select().from(lexiconsTable).where(eq(lexiconsTable.trainingSessionId, trainingSessionId));
  //     const newLexicon = lexicons.filter((lexicon) => existingLexicons.findIndex((w) => w.lexicon === lexicon) === -1);
  //     const deletedLexicons = existingLexicons
  //       .filter((lexicon) => lexicons.findIndex((w) => w === lexicon.lexicon) === -1)
  //       .map((lexicon) => lexicon.lexicon);
  //     if (newLexicon.length > 0) {
  //       await opts.ctx.db
  //         .insert(lexiconsTable)
  //         .values(newLexicon.map((lexicon) => ({ languageId: updatedTrainingSession.languageId, lexicon, trainingSessionId })))
  //         .onConflictDoNothing();
  //     }
  //     if (deletedLexicons.length > 0) {
  //       await opts.ctx.db.delete(lexiconsTable).where(inArray(lexiconsTable.lexicon, deletedLexicons));
  //     }
  //     const finalLexicons = await opts.ctx.db.select().from(lexiconsTable).where(eq(lexiconsTable.trainingSessionId, trainingSessionId));
  //     return { ...updatedTrainingSession, lexicons: finalLexicons } satisfies PublicTrainingSession;
  //   }),
});
