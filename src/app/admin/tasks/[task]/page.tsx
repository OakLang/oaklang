import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import TaskDetails from './_components/task-details';

type Props = {
  params: {
    task: string;
  };
};

export default function TaskPage({ params }: Props) {
  return (
    <main>
      <TitleBar
        hideBackButton
        title={
          <Breadcrumbs
            items={[
              { href: '/admin/tasks', label: 'Background Tasks' },
              { href: `/admin/tasks/${params.task}`, label: params.task },
            ]}
          />
        }
      />
      <TaskDetails task={params.task} />
    </main>
  );
}
