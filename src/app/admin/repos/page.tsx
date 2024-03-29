import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import ReposList from './_components/repos-list';

export default function ReposPage() {
  return (
    <main>
      <TitleBar hideBackButton title={<Breadcrumbs items={[{ href: '/admin/repos', label: 'Repos' }]} />} />
      <ReposList />
    </main>
  );
}
