'use client';

import { DialogClose } from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { LuLoader2, LuTrash } from 'react-icons/lu';
import { Dialog } from '~/components/shared/Dialog';
import { Button } from '~/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { api } from '~/trpc/client';
import { APP_NAME } from '~/utils/constants';

export default function DeleteAccountCard() {
  const router = useRouter();
  const deleteAccount = api.auth.deleteAccount.useMutation();

  const onClickDeleteAccount = async () => {
    await deleteAccount.mutateAsync();
    router.push('/');
    router.refresh();
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Permanently remove your Personal Account and all of its contents from the {APP_NAME} platform. This action is not reversible, so
          please continue with caution.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Dialog
          description="This can’t be reversed."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button disabled={deleteAccount.isLoading} onClick={onClickDeleteAccount} variant="destructive">
                  {deleteAccount.isLoading ? <LuLoader2 className="animate-spin" size={20} /> : null}
                  Delete account
                </Button>
              </DialogClose>
            </>
          }
          title="Are you sure?"
          trigger={
            <Button disabled={deleteAccount.isLoading} variant="destructive">
              {deleteAccount.isLoading ? (
                <LuLoader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LuTrash className="-ml-1 mr-2 h-5 w-5" />
              )}
              Delete account
            </Button>
          }
        />
      </CardFooter>
    </Card>
  );
}
