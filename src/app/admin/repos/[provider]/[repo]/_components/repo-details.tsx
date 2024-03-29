'use client';

import { LuLoader2 } from 'react-icons/lu';
import { api } from '~/trpc/client';

export default function RepoDetails({ provider, repo }: { provider: string; repo: string }) {
  const repoQuery = api.admin.getUserIntegrationScrapeRepo.useQuery({
    id: repo,
    provider,
  });

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      {repoQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LuLoader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : repoQuery.isError ? (
        <div className="text-muted-foreground">
          <p>{repoQuery.error.message}</p>
        </div>
      ) : !repoQuery.data ? (
        <div className="text-muted-foreground">
          <p>Repo not found!</p>
        </div>
      ) : (
        <>
          <div>
            <div className="text-lg font-semibold">
              {repoQuery.data.provider} repo {repoQuery.data.fullName}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Created {repoQuery.data.createdAt.toISOString()}</p>
          </div>

          <hr className="h-px bg-border" />

          <div>
            <pre className="overflow-x-auto rounded-md bg-secondary p-4">{JSON.stringify(repoQuery.data.repo, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
}
