import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '~/server/routers';

// We need to use this react trpc api instead of the prevous api whcih is designed for pages dir.
export const api = createTRPCReact<AppRouter>();
