'use client';

import { Button } from '~/components/ui/button';
import { IntegrationSwitch } from './IntegrationSwitch';
import { api } from '~/trpc/client';

const ConnectAccountsStep = ({
  onNextStep,
  onPrevousStep,
  canGoNext,
}: {
  canGoNext?: boolean;
  onNextStep?: () => void;
  onPrevousStep?: () => void;
}) => {
  const integrationsQuery = api.integrations.allIntegrationsForUser.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });

  if (integrationsQuery.isLoading) {
    return <p>Loading…</p>;
  }

  if (integrationsQuery.isError) {
    return <p>{integrationsQuery.error.message}</p>;
  }

  return (
    <div className="container my-8 max-w-lg px-4 md:my-16">
      <div className="flex flex-col">
        {integrationsQuery.data.map((integration) => (
          <IntegrationSwitch integration={integration} key={integration.clientId} />
        ))}
      </div>
      <div className="mt-8 flex">
        {onPrevousStep ? (
          <Button onClick={onPrevousStep} variant="secondary">
            Back
          </Button>
        ) : null}
        <div className="flex-1" />
        {onNextStep ? (
          <Button disabled={!canGoNext} onClick={onNextStep}>
            Continue
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default ConnectAccountsStep;
