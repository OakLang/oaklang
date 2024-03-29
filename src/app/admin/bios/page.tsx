import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import BiosList from './_components/bios-list';

export default function BiosPage() {
  return (
    <main>
      <TitleBar hideBackButton title={<Breadcrumbs items={[{ href: '/admin/bios', label: 'Bios' }]} />} />
      <BiosList />
    </main>
  );
}
