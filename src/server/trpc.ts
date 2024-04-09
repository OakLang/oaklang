import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import { transformer } from '~/trpc/shared';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape;
  },
  transformer,
});

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
