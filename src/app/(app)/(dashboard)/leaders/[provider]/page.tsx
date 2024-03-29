import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LeadersFilterButton from '~/components/LeadersFilterButton';
import TitleBar from '~/components/TitleBar';
import { integrations } from '~/integrations/list';
import { getIntegrationIdFromName } from '~/integrations/utils';
import { APP_NAME } from '~/utils/constants';
import TopUsersList from './_components/top-users-list';

type Props = {
  params: {
    provider: string;
  };
};

export const generateMetadata = ({ params: { provider } }: Props) => {
  const integration = integrations.find((integration) => getIntegrationIdFromName(integration.name) === provider);

  if (!integration) {
    return {};
  }
  return {
    title: `Top leaders from ${integration.name} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default function LeadersForEachProviderPage({ params: { provider } }: Props) {
  const integration = integrations.find((integration) => getIntegrationIdFromName(integration.name) === provider);

  if (!integration) {
    notFound();
  }

  return (
    <main>
      <TitleBar
        title={
          <div className="flex">
            {integration.icon ? (
              <span
                className="mr-2 h-6 w-6 fill-foreground"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: integration.icon }}
              />
            ) : null}
            <p className="line-clamp-1 text-lg font-bold leading-6">{integration.name}</p>
          </div>
        }
        trailing={<LeadersFilterButton />}
      />
      <TopUsersList provider={provider} />
    </main>
  );
}
