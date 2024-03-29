'use client';

import { FiEdit } from 'react-icons/fi';
import Link from '~/components/shared/Link';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { formatNumberWithSuffix } from '~/utils';
import { OnboardingStep, stepToPath } from '~/stores/onboarding-store';
import { api } from '~/trpc/client';

export default function ConnectionsCard() {
  const { data: integrations } = api.integrations.allIntegrationsForUser.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          {formatNumberWithSuffix(integrations?.reduce((c, i) => c + i.connections.length, 0) ?? 0, 'connected account')}
          <Link className="ml-1 inline-block" href={stepToPath.get(OnboardingStep.second)!}>
            <FiEdit />
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
