import type { ReactNode } from 'react';
import TitleBar from '~/components/TitleBar';
import MembersFollowersTabs from './_components/members-followers-tabs';
import { db } from '~/server/db';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { listToPublicList } from '~/utils/backend';
import { List } from '~/server/schema';

type Props = {
  children: ReactNode;
  params: {
    listId: string;
  };
};

export default async function ListTabsLayout({ children, params }: Props) {
  const list = await db.query.List.findFirst({ where: and(eq(List.id, params.listId), eq(List.isActive, true)) });

  if (!list) {
    notFound();
  }

  const publicList = await listToPublicList(list);

  return (
    <main>
      <TitleBar
        bottom={<MembersFollowersTabs list={publicList} />}
        title={
          <div className="flex-1">
            <p className="line-clamp-1 text-lg font-bold leading-6">{publicList.name}</p>
            <p className="line-clamp-1 text-sm leading-4 text-muted-foreground">@{publicList.user.username ?? publicList.user.id}</p>
          </div>
        }
      />
      {children}
    </main>
  );
}
