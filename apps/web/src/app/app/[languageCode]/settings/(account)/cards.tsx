"use client";

import _ from "lodash";
import { Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
import { api } from "~/trpc/react";

export const ResetAccountCard = () => {
  const resetAccountMut = api.users.resetAccount.useMutation({
    onSuccess: () => {
      localStorage.clear();
      window.location.reload();
    },
    onError: (error) => {
      toast("Failed to reset your account", { description: error.message });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Account</CardTitle>
        <CardDescription>
          Erase all your language progress, training sessions, and personalized
          settings. This action is irreversible.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={resetAccountMut.isPending}>
              {resetAccountMut.isPending && (
                <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
              )}
              Reset My Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Your Data</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete all your data, including the
                words you’re practicing, words you’ve mastered, all training
                sessions, language progress, and your personalized settings.
                This cannot be undone. Are you sure you want to reset
                everything?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Never mind</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetAccountMut.mutate()}>
                I understand, delete all my data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export const DeleteAccountCard = () => {
  const t = useTranslations("AccountPage.deleteAccountCard");
  const deleteAccountMut = api.users.deleteAccount.useMutation({
    onSuccess: async () => {
      await signOut();
      localStorage.clear();
    },
    onError: (error) => {
      toast("Failed to delete account", { description: error.message });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleteAccountMut.isPending}>
              {deleteAccountMut.isPending && (
                <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
              )}
              {t("deleteMyAccount")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("alert.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("alert.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("alert.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteAccountMut.mutate()}>
                {t("alert.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};
