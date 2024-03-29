import { and, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TitleBar from '~/components/TitleBar';
import { db } from '~/server/db';
import { List } from '~/server/schema';
import { APP_NAME } from '~/utils/constants';
import ListDetails from './_components/list-details';
import ListTimelineFeed from './_components/list-timeline-feed';
import { listToPublicList } from '~/utils/backend';

type Props = {
  params: {
    listId: string;
  };
};

export const generateMetadata = async ({ params }: Props) => {
  const list = await db.query.List.findFirst({
    columns: {
      name: true,
    },
    where: and(eq(List.isActive, true), eq(List.id, params.listId)),
    with: {
      user: {
        columns: {
          username: true,
        },
      },
    },
  });

  if (!list) {
    return {};
  }

  return {
    title: `@${list.user.username}/${list.name} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function ListPage({ params }: Props) {
  const list = await db.query.List.findFirst({
    where: and(eq(List.isActive, true), eq(List.id, params.listId)),
  });
  if (!list) {
    notFound();
  }
  const publicList = await listToPublicList(list);

  return (
    <main>
      <TitleBar
        title={
          <div>
            <p className="line-clamp-1 text-lg font-bold leading-6">{publicList.name}</p>
            <p className="line-clamp-1 text-sm leading-4 text-muted-foreground">@{publicList.user.username}</p>
          </div>
        }
      />
      <ListDetails list={publicList} />
      <ListTimelineFeed listId={params.listId} />
    </main>
  );
}
