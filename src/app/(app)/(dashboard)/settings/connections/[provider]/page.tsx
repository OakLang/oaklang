import { notFound } from 'next/navigation';
import TitleBar from '~/components/TitleBar';
import { integrations } from '~/integrations/list';
import { getIntegrationId } from '~/integrations/utils';
import IntegrationDetails from './_components/integration-details';
import { APP_NAME } from '~/utils/constants';
import type { Metadata } from 'next';

type Props = {
  params: {
    provider: string;
  };
};

export const generateMetadata = ({ params }: Props) => {
  const integration = integrations.find((integration) => params.provider === getIntegrationId(integration));
  if (!integration) {
    return {};
  }

  return {
    title: `${integration.name} integration settings - ${APP_NAME}`,
  } satisfies Metadata;
};

export default function ProviderSettingsPage({ params }: Props) {
  const integration = integrations.find((integration) => params.provider === getIntegrationId(integration));
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
      />
      <IntegrationDetails provider={params.provider} />
    </main>
  );
}
