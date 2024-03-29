import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { db } from '~/server/db';
import { List } from '~/server/schema';
import { APP_NAME } from '~/utils/constants';
import FollowersList from './_components/followers-list';

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
    where: eq(List.id, params.listId),
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
    title: `People following @${list.user.username}/${list.name} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default function ListFollowersPage({ params }: Props) {
  return <FollowersList listId={params.listId} />;
}
