import type { IntegrationWithConnections } from '~/utils/types';
import { NODE_ENV } from '~/utils/constants';
import { useCallback } from 'react';
import { useWatchForIntegrationRefresh } from './useWatchForIntegrationRefresh';
import { api } from '~/trpc/client';
import { useAuth } from '~/providers/AuthProvider';

export const useOnIntegrationToggle = () => {
  const disconnectIntegration = api.integrations.disconnectIntegration.useMutation();
  const { currentUser } = useAuth();
  const utils = api.useUtils();
  useWatchForIntegrationRefresh();

  return useCallback(
    async (integration: IntegrationWithConnections, manualConnectCallback: () => void) => {
      if (integration.isConnected) {
        await disconnectIntegration.mutateAsync({ provider: integration.name });
        void utils.integrations.allIntegrationsForUser.refetch();
        return;
      }

      if (integration.isManualValidation) {
        manualConnectCallback();
        return;
      }

      if (typeof window === 'undefined') {
        return;
      }

      if (integration.isAwaitingVerification && NODE_ENV !== 'development' && !currentUser?.isAdmin) {
        return;
      }

      const newWindowHeight = screen.height * 0.7;
      const newWindowWidth = screen.height > 900 ? 900 : screen.height * 0.9;
      const x = screen.width / 2 - newWindowWidth / 2;
      const y = screen.height / 2 - newWindowHeight / 2;
      window.open(integration.oauthUrl, 'wonderful', `height=${newWindowHeight},width=${newWindowWidth},left=+${x}+,top=+${y}`);
    },
    [currentUser?.isAdmin, disconnectIntegration, utils.integrations.allIntegrationsForUser],
  );
};
