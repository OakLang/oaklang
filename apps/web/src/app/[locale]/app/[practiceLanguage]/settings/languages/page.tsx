"use client";

import { Fragment } from "react";
import Image from "next/image";
import { Loader2, XIcon } from "lucide-react";
import { toast } from "sonner";

import PageTitle from "~/components/PageTitle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { useRouter } from "~/i18n/routing";
import { api } from "~/trpc/react";
import { APP_NAME } from "~/utils/constants";

export default function LanguagesPage() {
  const practiceLanguage = usePracticeLanguageCode();
  const practiceLanguagesQuery = api.languages.getPracticeLanguages.useQuery();
  const utils = api.useUtils();
  const router = useRouter();

  const deletePracticeLanguageMut =
    api.languages.deletePracticeLanguage.useMutation({
      onSuccess: (data) => {
        void utils.languages.getPracticeLanguages.invalidate();
        toast(`Your ${data.language.name} data has been deleted.`);
        if (practiceLanguage === data.language.code) {
          const newLang = practiceLanguagesQuery.data?.find(
            (item) => item.code !== data.language.code,
          );
          if (newLang) {
            router.push(`/app/${newLang.code}/settings/languages`);
          } else {
            router.push("/app");
          }
        }
      },
      onError: (error) => {
        toast("Failed to delete language", {
          description: error.message,
        });
      },
    });

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle
        title="Languages"
        description="Manage all your practice languages. If you remove a language, you will instantly lose all your data for that language."
      />
      <Separator className="my-8" />
      {practiceLanguagesQuery.isPending ? (
        [1, 2, 3, 4, 5].map((item, i) => (
          <Fragment key={item}>
            <div className="flex items-center">
              <Skeleton className="mr-4 h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <div className="flex-1"></div>
              <Skeleton className="h-10 w-32" />
            </div>
            {i < 4 && <Separator className="my-4" />}
          </Fragment>
        ))
      ) : practiceLanguagesQuery.isError ? (
        <p>{practiceLanguagesQuery.error.message}</p>
      ) : (
        practiceLanguagesQuery.data.map((item, i) => {
          const isDeleting =
            deletePracticeLanguageMut.isPending &&
            deletePracticeLanguageMut.variables === item.code;
          return (
            <Fragment key={item.code}>
              <div className="flex items-center">
                <Image
                  src={`https://hatscripts.github.io/circle-flags/flags/${item.countryCode}.svg`}
                  alt={item.name}
                  className="mr-4 h-8 w-8 object-cover"
                  width={48}
                  height={48}
                />
                <p className="flex-1 truncate">{item.name}</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XIcon className="-ml-1 mr-2 h-4 w-4" />
                      )}
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to delete {item.name}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        By clicking the button below you are deleting all data
                        from your {item.name} account on {APP_NAME}. All
                        sessions, stats and word tracking will be lost and can
                        not be recovered.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction
                        onClick={() =>
                          deletePracticeLanguageMut.mutate(item.code)
                        }
                      >
                        I understand, Delete my {item.name} data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {i < practiceLanguagesQuery.data.length - 1 && (
                <Separator className="my-4" />
              )}
            </Fragment>
          );
        })
      )}
    </div>
  );
}
