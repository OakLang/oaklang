import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import IntegrationsGrid from './_components/integrations-grid';

export default function IntegrationsPage() {
  return (
    <main>
      <TitleBar hideBackButton title={<Breadcrumbs items={[{ href: '/admin/integrations', label: 'Integrations' }]} />} />
      <IntegrationsGrid />
    </main>
  );
}
