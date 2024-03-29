import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import ScrapeDetails from './_components/scrape-details';

type Props = {
  params: {
    integration: string;
    scrape: string;
    user: string;
  };
};

export default function ScrapePage({ params }: Props) {
  return (
    <div>
      <TitleBar
        hideBackButton
        title={
          <Breadcrumbs
            items={[
              { href: '/admin/users', label: 'Users' },
              { href: `/admin/users/${params.user}`, label: params.user },
              { href: `/admin/users/${params.user}`, label: 'Integrations' },
              { href: `/admin/users/${params.user}/integrations/${params.integration}`, label: params.integration },
              { href: `/admin/users/${params.user}/integrations/${params.integration}`, label: 'Scrapes' },
              { href: `/admin/users/${params.user}/integrations/${params.integration}/scrapes/${params.scrape}`, label: params.scrape },
            ]}
          />
        }
      />
      <ScrapeDetails {...params} />
    </div>
  );
}
