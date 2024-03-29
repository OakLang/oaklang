import TitleBar from '~/components/TitleBar';
import ProviderIntegrationsList from './_components/provider-integrations-list';
import Breadcrumbs from '~/components/Breadcrumbs';

type Props = {
  params: {
    provider: string;
  };
};
export default function IntegrationProviderPage({ params }: Props) {
  return (
    <main>
      <TitleBar
        hideBackButton
        title={
          <Breadcrumbs
            items={[
              { href: '/admin/integrations', label: 'Integrations' },
              { href: `/admin/integrations/${params.provider}`, label: params.provider },
            ]}
          />
        }
      />
      <ProviderIntegrationsList provider={params.provider} />
    </main>
  );
}
