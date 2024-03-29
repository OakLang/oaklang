import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import RepoDetails from './_components/repo-details';

type Props = {
  params: {
    provider: string;
    repo: string;
  };
};

export default function RepoPage({ params }: Props) {
  return (
    <main>
      <TitleBar
        hideBackButton
        title={
          <Breadcrumbs
            items={[
              { href: '/admin/repos', label: 'Repos' },
              { href: '/admin/repos', label: params.provider },
              { href: `/admin/repos/${params.provider}/${params.repo}`, label: params.repo },
            ]}
          />
        }
      />
      <RepoDetails {...params} />
    </main>
  );
}
