"use client";

import { Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("AccountPage");

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle title={t("title")} description={t("description")} />
      <Separator className="my-8" />
      <DeleteAccountCard />
    </div>
  );
}

const DeleteAccountCard = () => {
  const t = useTranslations("AccountPage.deleteAccountCard");
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
