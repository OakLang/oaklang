'use client';

import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar';
import { LuLoader2, LuUser } from 'react-icons/lu';
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip';
import { useCallback, useEffect, useState } from 'react';
import AvatarPickerDialogContent from 'src/components/profile/AvatarPickerDialogContent';
import BioPickerDialogContent from 'src/components/profile/BioPickerDialogContent';
import { Button } from 'src/components/ui/button';
import { Dialog } from 'src/components/shared/Dialog';
import { FiEdit } from 'react-icons/fi';
import FollowButton from 'src/components/FollowButton';
import IntegrationsList from 'src/components/IntegrationsList';
import Link from 'next/link';
import NamePickerDialogContent from 'src/components/profile/NamePickerDialogContent';
import type { PublicUser } from '~/utils/types';
import { Skeleton } from 'src/components/ui/skeleton';
import { formatNumber } from '~/utils';
import pluralize from 'pluralize';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';
import ProfileSkeleton from './profile-skeleton';

interface Props {
  follow?: boolean;
  isFollowing?: boolean;
  isMyProfile: boolean;
  profile?: PublicUser;
  username: string;
}

export default function ProfileDetails(props: Props) {
  const { username, follow: shouldFollow, profile: initialProfile, isFollowing: initialIsFollowing, isMyProfile } = props;
  const [showFollowConfirmDialog, setShowFollowConfirmDialog] = useState(false);
  const [followDialogOpenedOnce, setFollowDialogOpenedOnce] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showNamePicker, setShowNamePicker] = useState(false);
  const [showBioPicker, setShowBioPicker] = useState(false);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const profileQuery = api.users.publicProfileInfo.useQuery(username, { initialData: initialProfile });
  const followingQuery = api.users.isFollowingUser.useQuery(profileQuery.data?.id, {
    enabled: profileQuery.isSuccess,
    initialData: initialIsFollowing,
  });
  const badgesQuery = api.users.getBadges.useQuery(profileQuery.data?.id ?? '', { enabled: profileQuery.isSuccess });
  const followUser = api.users.followUser.useMutation();
  const unFollowUser = api.users.unFollowUser.useMutation();
  const setProfileDefaultMut = api.users.setProfileDefault.useMutation();
  const setBioMut = api.users.setBio.useMutation();
  const utils = api.useUtils();

  const toggleFollow = useCallback(async () => {
    if (!profileQuery.isSuccess || !followingQuery.isSuccess || isAuthLoading) {
      return;
    }
    if (isMyProfile) {
      return;
    }
    if (!isAuthenticated) {
      return;
    }
    if (followingQuery.data === true) {
      await unFollowUser.mutateAsync(profileQuery.data.id);
    } else {
      await followUser.mutateAsync(profileQuery.data.id);
    }
    await followingQuery.refetch();
    await profileQuery.refetch();
    setShowFollowConfirmDialog(false);
  }, [followUser, followingQuery, isAuthLoading, isAuthenticated, isMyProfile, profileQuery, unFollowUser]);

  const changeAvatar = () => {
    setShowAvatarPicker(true);
  };

  const onSelectAvatar = async (integrationId: string) => {
    setShowAvatarPicker(false);
    await setProfileDefaultMut.mutateAsync({ defaultType: 'avatar', integrationId });
    void profileQuery.refetch();
    if (profileQuery.data) {
      void utils.users.getIntegrations.invalidate({ userId: profileQuery.data.id });
    }
  };
  const onSelectName = async (integrationId: string) => {
    setShowNamePicker(false);
    await setProfileDefaultMut.mutateAsync({ defaultType: 'name', integrationId });
    void profileQuery.refetch();
    if (profileQuery.data) {
      void utils.users.getIntegrations.invalidate({ userId: profileQuery.data.id });
    }
  };

  const changeBio = () => {
    setShowBioPicker(true);
  };

  const changeName = () => {
    setShowNamePicker(true);
  };

  const onSelectBio = async (bioId: string) => {
    setShowBioPicker(false);
    await setBioMut.mutateAsync({ bioId });
    await profileQuery.refetch();
  };

  useEffect(() => {
    if (followDialogOpenedOnce || !profileQuery.isSuccess || isMyProfile) {
      return;
    }

    if (shouldFollow && !followingQuery.isLoading && !followingQuery.data) {
      setShowFollowConfirmDialog(true);
      setFollowDialogOpenedOnce(true);
    }
  }, [followDialogOpenedOnce, followingQuery.data, followingQuery.isLoading, isMyProfile, profileQuery.isSuccess, shouldFollow]);

  if (profileQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.isError) {
    return (
      <div className="p-4 text-muted-foreground">
        <p>{profileQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-x-8 gap-y-4 p-4 max-sm:flex-col">
        <div className="relative h-fit w-fit flex-shrink-0">
          <Avatar className="h-32 w-32">
            <AvatarImage src={profileQuery.data.avatarUrl} />
            <AvatarFallback>
              <LuUser size={48} />
            </AvatarFallback>
          </Avatar>

          {isMyProfile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="absolute bottom-1 right-1 h-8 w-8 rounded-full" onClick={changeAvatar} size="icon" variant="outline">
                  <FiEdit size={18} />
                  <p className="sr-only">Change avatar</p>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Change avatar</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div className="sm:flex-1">
          <div className="flex gap-4">
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate text-xl font-bold">
                {profileQuery.data.name ?? `@${profileQuery.data.username}`}
                {isMyProfile ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="ml-2 inline-flex h-6 w-6" onClick={changeName} size="icon" variant="outline">
                        <FiEdit size={14} />
                        <p className="sr-only">Change name</p>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Change name</TooltipContent>
                  </Tooltip>
                ) : null}
              </h3>
              <div className="truncate text-muted-foreground">
                @{profileQuery.data.username ?? profileQuery.data.id}
                {isMyProfile ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild className="ml-2 inline-flex h-6 w-6" size="icon" variant="outline">
                        <Link href="/settings">
                          <FiEdit size={14} />
                          <p className="sr-only">Change username</p>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Change username</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </div>
            {isMyProfile ? null : followingQuery.isSuccess ? (
              <FollowButton
                isFollowing={followingQuery.data}
                isLoading={followUser.isLoading || unFollowUser.isLoading}
                onClick={toggleFollow}
                userName={profileQuery.data.name ?? profileQuery.data.username ?? undefined}
              />
            ) : (
              <Skeleton className="h-10 w-28" />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-4">
            <Link className="text-foreground hover:underline" href={`/${username}/followers`}>
              <span className="font-semibold">{formatNumber(profileQuery.data.followersCount)}</span>
              <span className="ml-1 text-muted-foreground">{pluralize('Follower', profileQuery.data.followersCount)}</span>
            </Link>
            <Link className="text-foreground hover:underline" href={`/${username}/following`}>
              <span className="font-semibold">{formatNumber(profileQuery.data.followingCount)}</span>
              <span className="ml-1 text-muted-foreground">Following</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <div className="leading-6">
          {profileQuery.data.bio ?? 'AI-generated bio displayed after 3+ social profiles connected'}{' '}
          {isMyProfile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="inline-flex h-6 w-6" onClick={changeBio} size="icon" variant="outline">
                  <FiEdit size={14} />
                  <p className="sr-only">Change bio</p>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Change bio</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      <div className="p-4 pt-0">
        <IntegrationsList userId={profileQuery.data.id} />
      </div>

      {badgesQuery.isLoading ? (
        <div className="p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-10 w-56" />
          </div>
        </div>
      ) : badgesQuery.isError ? (
        <p className="text-muted-foreground">{badgesQuery.error.message}</p>
      ) : badgesQuery.data.length === 0 ? null : (
        <div className="p-4 pt-0">
          <p className="mb-2 font-semibold">Badges</p>
          <div className="flex flex-wrap gap-2">
            {badgesQuery.data.map((badge) => (
              <div
                className="flex h-10 items-center rounded-md border px-3 text-sm font-medium"
                key={`${badge.userId}-${badge.provider}-${badge.programLanguageName}`}
              >
                Over {formatNumber(badge.score)} hours in {badge.programLanguageName}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog
        footer={
          followingQuery.data ? null : (
            <Button disabled={followUser.isLoading || unFollowUser.isLoading} onClick={toggleFollow}>
              {followUser.isLoading || unFollowUser.isLoading ? <LuLoader2 className="-ml-1 mr-2" size={22} /> : null}
              Follow
            </Button>
          )
        }
        onOpenChange={setShowFollowConfirmDialog}
        open={showFollowConfirmDialog}
        title={`Follow ${profileQuery.data.name ?? profileQuery.data.username}`}
      />

      <Dialog onOpenChange={setShowAvatarPicker} open={showAvatarPicker}>
        <AvatarPickerDialogContent onSelect={onSelectAvatar} userId={profileQuery.data.id} />
      </Dialog>

      <Dialog onOpenChange={setShowBioPicker} open={showBioPicker} title="Select your AI-generated bio">
        <BioPickerDialogContent
          bio={profileQuery.data.bio}
          onClose={() => setShowBioPicker(false)}
          onSelect={(bioId) => onSelectBio(bioId)}
          profile={profileQuery.data}
        />
      </Dialog>

      <Dialog onOpenChange={setShowNamePicker} open={showNamePicker} title="Select your name">
        <NamePickerDialogContent onSelect={onSelectName} userId={profileQuery.data.id} />
      </Dialog>
    </div>
  );
}
