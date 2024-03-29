import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import TasksList from './_components/tasks-list';

export default function TasksPage() {
  return (
    <main>
      <TitleBar hideBackButton title={<Breadcrumbs items={[{ href: '/admin/tasks', label: 'Background Tasks' }]} />} />
      <TasksList />
    </main>
  );
}
