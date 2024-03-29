import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import UsersList from './_components/users-list';

export default function UsersPage() {
  return (
    <main>
      <TitleBar hideBackButton title={<Breadcrumbs items={[{ href: '/admin/users', label: 'Users' }]} />} />
      <UsersList />
    </main>
  );
}
