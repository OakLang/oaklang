import { Fragment, useCallback, useMemo, useState } from 'react';
import { OnboardingStep, stepToPath } from '~/stores/onboarding-store';
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextButton,
  PaginationPreviousButton,
} from 'src/components/ui/pagination';
import { Button } from 'src/components/ui/button';
import Link from 'next/link';
import { LuCheck } from 'react-icons/lu';
import { MIN_INTEGRATIONS_FOR_ONBOARDING } from '~/utils/constants';
import type { PublicUser } from '~/utils/types';
import type { TRPCError } from '@trpc/server';
import { cn } from '~/utils';
import { pagesRange } from '~/utils/helpers';
import { useToast } from 'src/components/ui/use-toast';
import { api } from '~/trpc/client';

export default function BioPickerDialogContent({
  profile,
  bio: bioText,
  onSelect,
  onClose,
}: {
  bio?: string | null;
  onClose?: () => void;
  onSelect?: (bioId: string) => void;
  profile: PublicUser;
}) {
  const [bioPage, setBioPage] = useState(1);
  const biosQuery = api.users.getUserBioChoices.useQuery({ page: bioPage, userId: profile.id });
  const utils = api.useUtils();
  const generateSecondBio = api.integrations.generateSecondBio.useMutation();
  const { toast } = useToast();

  const totalPages = useMemo(() => biosQuery.data?.totalPages ?? 0, [biosQuery.data?.totalPages]);
  const page = useMemo(() => biosQuery.data?.page ?? 0, [biosQuery.data?.page]);
  const pages = useMemo(() => (totalPages > 1 ? pagesRange(totalPages, page) : []), [page, totalPages]);

  const onClickGenerateSecondBio = useCallback(async () => {
    try {
      await generateSecondBio.mutateAsync();
      if (profile.username) {
        await utils.users.publicProfileInfo.refetch(profile.username);
      }
      toast({ title: 'Bio generated' });
      onClose?.();
    } catch (error: unknown) {
      toast({ description: (error as TRPCError).message, title: 'Failed to generate second bio', variant: 'destructive' });
    }
  }, [generateSecondBio, onClose, profile.username, toast, utils.users.publicProfileInfo]);

  return (
    <div className="p-6 pt-0">
      {biosQuery.isLoading ? (
        <p>Loading…</p>
      ) : biosQuery.isError ? (
        <p>{biosQuery.error.message}</p>
      ) : !biosQuery.data?.total ? (
        <div className="py-8">
          <p className="text-center text-muted-foreground">
            <Link className="font-medium text-foreground hover:underline" href={stepToPath.get(OnboardingStep.second) ?? '/onboard'}>
              Connect at least 3 accounts
            </Link>{' '}
            to enable your AI-generated bio.
          </p>
        </div>
      ) : (
        <div>
          <div className="space-y-2">
            {biosQuery.data.bios.map((bio) => {
              const selected = bioText && bio.text === bioText;
              return (
                <Button
                  className={cn('relative h-fit w-full justify-start whitespace-normal rounded-lg p-4 pr-10 text-left text-sm', {
                    'bg-muted': selected,
                  })}
                  key={bio.id}
                  onClick={() => onSelect?.(bio.id)}
                  title={bio.createdAt.toISOString()}
                  variant="outline"
                >
                  {selected ? (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <LuCheck size={14} />
                    </div>
                  ) : null}
                  {bio.text}
                </Button>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-2 overflow-x-auto p-2">
              <Pagination className="mx-auto w-fit">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPreviousButton disabled={bioPage <= 1} onClick={() => setBioPage(bioPage - 1)} />
                  </PaginationItem>
                  {pages.map((p, i) => {
                    const last = i == pages.length - 1;
                    if ((i == 0 && p > 1) || (last && p < totalPages)) {
                      return (
                        <Fragment key={`pagination-${totalPages}-${page}-${p}`}>
                          {last ? (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : null}

                          <PaginationItem>
                            <PaginationButton disabled={page <= 1} onClick={() => setBioPage(last ? totalPages : 1)}>
                              {last ? totalPages : 1}
                            </PaginationButton>
                          </PaginationItem>
                          {i == 0 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </Fragment>
                      );
                    } else {
                      return (
                        <PaginationItem key={`pagination-${totalPages}-${page}-${p}`}>
                          <PaginationButton isActive={p == page} onClick={() => setBioPage(p)}>
                            {p}
                          </PaginationButton>
                        </PaginationItem>
                      );
                    }
                  })}
                  <PaginationItem>
                    <PaginationNextButton disabled={bioPage >= totalPages} onClick={() => setBioPage(bioPage + 1)} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {biosQuery.data.total <= 1 && profile.integrations.length >= MIN_INTEGRATIONS_FOR_ONBOARDING && (
            <div className="mt-4 flex justify-center">
              <Button onClick={onClickGenerateSecondBio}>Generate another bio</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
