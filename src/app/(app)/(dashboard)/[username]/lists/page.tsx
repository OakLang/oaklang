import type { Metadata } from 'next';
import { IoAdd } from 'react-icons/io5';
import TitleBar from '~/components/TitleBar';
import CreateNewListDialog from '~/components/dialogs/CreateNewListDialog';
import { Button } from '~/components/ui/button';
import { getUser, getUserByUsername } from '~/utils/server-auth';
import { APP_NAME } from '~/utils/constants';
import ListsList from './_components/lists-list';
import { notFound } from 'next/navigation';

type Props = {
  params: {
    username: string;
  };
};

export const generateMetadata = ({ params }: Props) => {
  return {
    title: `Lists created by @${params.username} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function ListsPage({ params }: Props) {
  const user = await getUserByUsername(params.username, {
    profileDefaults: true,
  });
  if (!user || !user.isActive) {
    notFound();
  }
  const currentUser = await getUser();
  return (
    <main>
      <TitleBar
        title={
          <div>
            <p className="line-clamp-1 text-lg font-bold leading-6">Lists</p>
            <p className="line-clamp-1 text-sm leading-4 text-muted-foreground">@{params.username}</p>
          </div>
        }
        trailing={
          currentUser?.username === params.username ? (
            <CreateNewListDialog>
              <Button variant="outline">
                <IoAdd className="-ml-1 mr-2 h-5 w-5" />
                New List
              </Button>
            </CreateNewListDialog>
          ) : null
        }
      />
      <ListsList username={params.username} />
    </main>
  );
}
