'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { httpBatchLink } from '@trpc/client';
import { getCookie } from 'cookies-next';
import { CSRF_COOKIE, CSRF_TOKEN_HEADER } from '~/utils/constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '~/trpc/client';
import { getTrpcUrl, transformer } from '~/trpc/shared';

export default function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          headers: ({ opList }) => {
            // client
            if (!opList.find((op) => op.type !== 'query')) {
              return {};
            }

            const token = getCookie(CSRF_COOKIE);
            if (!token) {
              return {};
            }

            return {
              [CSRF_TOKEN_HEADER]: token,
            };
          },
          url: getTrpcUrl(),
        }),
      ],
      transformer,
    }),
  );
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
