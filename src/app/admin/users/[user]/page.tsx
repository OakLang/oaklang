import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import UserDetails from './_components/user-details';

type Props = {
  params: {
    user: string;
  };
};

export default function UserPage({ params }: Props) {
  return (
    <main>
      <TitleBar
        hideBackButton
        title={
          <Breadcrumbs
            items={[
              { href: '/admin/users', label: 'Users' },
              { href: `/admin/users/${params.user}`, label: params.user },
            ]}
          />
        }
      />
      <UserDetails userId={params.user} />
    </main>
  );
}
