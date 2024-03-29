import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import LinksList from './_components/links-list';

export default function LogInLinksPage() {
  return (
    <main>
      <TitleBar
        hideBackButton
        title={
          <Breadcrumbs
            items={[
              { href: '/admin/users', label: 'Users' },
              { href: '/admin/users/login-links', label: 'Login Links' },
            ]}
          />
        }
      />
      <LinksList />
    </main>
  );
}
