"use client";

import { Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import PageTitle from "~/components/PageTitle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";

export default function AccountPage() {
  const deleteAccountMut = api.users.deleteAccount.useMutation({
    onSuccess: () => {
      localStorage.clear();
      void signOut();
    },
    onError: (error) => {
      toast("Failed to delete account", { description: error.message });
    },
  });

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle title="Account" description="Manage your account settings" />
      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>
            Deleting your account will delete all your personal and learning
            data.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deleteAccountMut.isPending}
              >
                {deleteAccountMut.isPending && (
                  <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                )}
                Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                <AlertDialogDescription>
                  You’re about to permanently delete your account. This action
                  will erase all your data on Oaklang, and it cannot be
                  recovered. Are you sure you want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Never mind</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteAccountMut.mutate()}>
                  I understand, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
