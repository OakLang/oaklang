import { useEffect } from 'react';
import { api } from '~/trpc/client';

export const useWatchForIntegrationRefresh = (): void => {
  const utils = api.useUtils();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {
        // No op
      };
    }
    const listen = (event: MessageEvent): void => {
      if (event.origin !== window.location.origin || !event.isTrusted) {
        return;
      }
      if (event.data != 'success') {
        return;
      }

      // void refetch();
      void utils.integrations.allIntegrationsForUser.refetch();
    };
    window.addEventListener('message', listen);
    return () => {
      // Clean up on remount
      window.removeEventListener('message', listen);
    };
  }, [utils.integrations.allIntegrationsForUser]);
};
