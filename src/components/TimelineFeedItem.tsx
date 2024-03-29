'use client';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { IoChevronUpCircleOutline, IoStarOutline } from 'react-icons/io5';
import { getIntegrationId, getIntegrationIdFromName } from '~/integrations/utils';
import { formatNumberWithSuffix } from '~/utils';
import { siGithub, siStackexchange } from 'simple-icons';
import type { FeedItem } from '~/utils/types';
import Link from 'next/link';
import { LuUser } from 'react-icons/lu';
import { Skeleton } from '~/components/ui/skeleton';
import { TimelineEventType } from '~/utils/types';
import TimelineTemplateComposer from './timeline/TimelineTemplateComposer';
import { integrations } from '~/integrations/list';
import { relativeDate } from '~/utils/helpers';
import { useMemo } from 'react';

export default function TimelineFeedItem({ feedItem }: { feedItem?: FeedItem }) {
  const provider = useMemo(() => integrations.find((i) => getIntegrationId(i) === feedItem?.provider), [feedItem?.provider]);

  if (!feedItem) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div>
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="mt-2 h-4 w-[200px]" />
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 md:pl-[72px]">
          <Skeleton className="h-4 w-4/12" />
          <Skeleton className="mt-2 h-4 w-6/12" />
        </div>
        <div className="flex gap-4 px-4 pb-4 md:pl-[72px]">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-[40px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm" key={feedItem.id}>
      <div className="flex p-4">
        <div className="flex items-center gap-4">
          <Avatar asChild>
            <Link href={feedItem.user.url}>
              <AvatarImage src={feedItem.user.avatarUrl} />
              <AvatarFallback>
                <LuUser size={20} />
              </AvatarFallback>
            </Link>
          </Avatar>
          <div>
            <Link className="font-semibold hover:underline" href={feedItem.user.url}>
              {feedItem.user.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              <Link className="font-medium hover:text-foreground hover:underline" href={feedItem.user.url}>
                @{feedItem.user.username}
              </Link>{' '}
              • {relativeDate(feedItem.postedAt)}
            </p>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 md:pl-[72px]">
        <h4>
          <TimelineTemplateComposer items={feedItem.title} />
        </h4>
        <p className="mt-2 text-sm text-muted-foreground">
          <TimelineTemplateComposer items={feedItem.subtitle} />
        </p>
        {(feedItem.description?.length ?? 0) > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            <TimelineTemplateComposer items={feedItem.description!} />
          </p>
        )}
      </div>
      <div className="flex gap-4 px-4 pb-4 md:pl-[72px]">
        {provider ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className="h-4 w-4 fill-current"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: provider.icon ?? '' }}
            />
            <p>{provider.name}</p>
          </div>
        ) : null}
        {feedItem.programLanguageName ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <div
              className="h-4 w-4 rounded-full border"
              style={{ ...(feedItem.programLanguageColor ? { backgroundColor: feedItem.programLanguageColor } : {}) }}
            />
            <p>{feedItem.programLanguageName}</p>
          </div>
        ) : null}
        {feedItem.provider === getIntegrationIdFromName(siGithub.title) &&
        !!feedItem.score &&
        feedItem.eventType == TimelineEventType.interaction.toString() ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <IoStarOutline className="h-4 w-4" />
            <p>{formatNumberWithSuffix(feedItem.score, 'star')}</p>
          </div>
        ) : null}
        {feedItem.provider === getIntegrationIdFromName(siStackexchange.title) && !!feedItem.score ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <IoChevronUpCircleOutline className="h-4 w-4" />
            <p>{formatNumberWithSuffix(feedItem.score, 'upvote')}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
