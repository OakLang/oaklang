import { OnboardingStep, stepToPath } from '~/stores/onboarding-store';
import { Button } from './ui/button';
import { FiEdit } from 'react-icons/fi';
import IntegrationShield from './IntegrationShield';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { api } from '~/trpc/client';
import { useAuth } from '~/providers/AuthProvider';

const IntegrationsList = ({ userId }: { userId: string }) => {
  const { currentUser } = useAuth();
  const integrationsQuery = api.users.getIntegrations.useQuery({ userId });

  return (
    <div className="flex flex-wrap gap-2">
      {integrationsQuery.isLoading ? (
        // eslint-disable-next-line react/no-array-index-key
        new Array(4).fill(1).map((_, i) => <Skeleton className="h-10 w-32" key={i} />)
      ) : integrationsQuery.isError ? (
        <p>{integrationsQuery.error.message}</p>
      ) : (
        integrationsQuery.data.map((integration) => <IntegrationShield integration={integration} key={integration.name} />)
      )}
      {currentUser && currentUser.id === userId ? (
        <Button asChild className="max-sm:h-8 max-sm:px-3" variant="outline">
          <Link href={stepToPath.get(OnboardingStep.second) ?? ''}>
            <FiEdit className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Manage Accounts
          </Link>
        </Button>
      ) : null}
    </div>
  );
};

export default IntegrationsList;
