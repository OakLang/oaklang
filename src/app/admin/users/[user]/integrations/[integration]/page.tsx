import React from 'react';
import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import IntegrationsDetails from './_components/integrations-details';

type Props = {
  params: {
    integration: string;
    user: string;
  };
};

export default function IntegrationPage({ params }: Props) {
  return (
    <main>
      <TitleBar
        hideBackButton
        title={
          <Breadcrumbs
            items={[
              { href: '/admin/users', label: 'Users' },
              { href: `/admin/users/${params.user}`, label: params.user },
              { href: `/admin/users/${params.user}`, label: 'Integrations' },
              { href: `/admin/users/${params.user}/integrations/${params.integration}`, label: params.integration },
            ]}
          />
        }
      />
      <IntegrationsDetails integration={params.integration} user={params.user} />
    </main>
  );
}
