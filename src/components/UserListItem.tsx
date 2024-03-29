import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

import FollowButton from './FollowButton';
import Link from 'next/link';
import { LuUser } from 'react-icons/lu';
import type { ReactNode } from 'react';

export default function UserListItem({
  name,
  username,
  isFollowing,
  avatarUrl,
  onToggleFollowing,
  isLoading,
  badgeText,
  subtitle,
  action,
}: {
  action?: ReactNode;
  avatarUrl: string;
  badgeText?: string;
  isFollowing?: boolean;
  isLoading?: boolean;
  name: string;
  onToggleFollowing?: () => void;
  subtitle?: ReactNode;
  username: string;
}) {
  return (
    <div className="group relative">
      <Link className="absolute inset-0 group-focus-within:bg-secondary/50 group-hover:bg-secondary/50" href={`/${username}`} />
      <div className="pointer-events-none relative flex flex-1 items-center gap-2 p-4">
        <Avatar>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>
            <LuUser size={20} />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="line-clamp-1 text-sm font-semibold leading-5 hover:underline">{name}</p>
          <div className="flex items-center gap-1">
            <p className="line-clamp-1 text-sm leading-5 text-muted-foreground">@{username}</p>
            {badgeText ? (
              <p className="whitespace-pre rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{badgeText}</p>
            ) : null}
          </div>
          {subtitle ? <div className="mt-1 whitespace-pre text-sm text-muted-foreground">{subtitle}</div> : null}
        </div>
        <div className="pointer-events-auto">
          {action ??
            (!!onToggleFollowing && (
              <FollowButton isFollowing={isFollowing} isLoading={isLoading} onClick={onToggleFollowing} userName={name} />
            ))}
        </div>
      </div>
    </div>
  );
}
