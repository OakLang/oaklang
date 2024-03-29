import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { db } from '~/server/db';
import { List } from '~/server/schema';
import { APP_NAME } from '~/utils/constants';
import MembersList from './_components/members-list';

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
    title: `Members of @${list.user.username}/${list.name} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default function ListMembersPage({ params }: Props) {
  return <MembersList listId={params.listId} />;
}
