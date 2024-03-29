'use client';

import { LuLoader2 } from 'react-icons/lu';
import Breadcrumbs from '~/components/Breadcrumbs';
import TitleBar from '~/components/TitleBar';
import { Button } from '~/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { useToast } from '~/components/ui/use-toast';
import { api } from '~/trpc/client';

export default function IngraPage() {
  const { toast } = useToast();

  const syncProgramLanguages = api.admin.syncProgramLanguages.useMutation({
    onError: (error) => {
      toast({ description: error.message, title: 'Failed to sync program languages', variant: 'destructive' });
    },
    onSuccess: (data) => {
      toast({ description: `Updated ${data.updated} langauges`, title: 'Successfully synced program languages' });
    },
  });

  const generateBiosForAllUsers = api.admin.generateBiosForAllUsers.useMutation({
    onError: (error) => {
      toast({ description: error.message, title: 'Failed to generate bios', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Generate bios for all users is now running in the background' });
    },
  });

  const refreshSuggestedFollowUsersTable = api.admin.refreshSuggestedFollowUsersTable.useMutation({
    onError: (error) => {
      toast({ description: error.message, title: 'Failed to refresh suggested follow users table', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Refresh suggested follow users table is now running in the background' });
    },
  });

  return (
    <main>
      <TitleBar hideBackButton title={<Breadcrumbs items={[{ href: '/admin/infra', label: 'Infra' }]} />} />
      <div className="container max-w-screen-xl space-y-8 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Program Languages</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button disabled={syncProgramLanguages.isLoading} onClick={() => syncProgramLanguages.mutateAsync()}>
              {syncProgramLanguages.isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" /> : null}
              Sync program languages
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button disabled={generateBiosForAllUsers.isLoading} onClick={() => generateBiosForAllUsers.mutateAsync()}>
              {generateBiosForAllUsers.isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" /> : null}
              Generate bio for all users
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Widgets</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button disabled={refreshSuggestedFollowUsersTable.isLoading} onClick={() => refreshSuggestedFollowUsersTable.mutateAsync()}>
              {refreshSuggestedFollowUsersTable.isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" /> : null}
              Refresh suggested friends sidebar widget table
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
