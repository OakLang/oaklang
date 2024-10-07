"use client";

import type { FormEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, Loader2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { api } from "~/trpc/react";

export default function NativeLanguageForm({
  nextPath = "/app",
}: {
  nextPath?: string;
}) {
  const [nativeLanguageCode, setNativeLanguageCode] = useState("");
  const languagesQuery = api.languages.getLanguages.useQuery();
  const router = useRouter();

  const nativeLanguage = useMemo(
    () => languagesQuery.data?.find((lang) => lang.code === nativeLanguageCode),
    [languagesQuery.data, nativeLanguageCode],
  );

  const updateUserSettingsMutation = useUpdateUserSettingsMutation();

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!nativeLanguage) {
        return;
      }
      updateUserSettingsMutation.mutate(
        { nativeLanguage: nativeLanguage.code },
        {
          onSuccess: () => {
            router.replace(nextPath);
          },
        },
      );
    },
    [nativeLanguage, nextPath, router, updateUserSettingsMutation],
  );

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="mx-auto justify-start text-left">
            {nativeLanguage ? (
              <>
                <Image
                  src={`https://hatscripts.github.io/circle-flags/flags/${nativeLanguage.countryCode}.svg`}
                  alt={nativeLanguage.name}
                  className="-ml-1 mr-2 h-5 w-5 object-cover"
                  width={24}
                  height={24}
                />
                <span className="flex-1 truncate">{nativeLanguage.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground flex-1 truncate">
                Choose your native language
              </span>
            )}
            <ChevronDownIcon className="-mr-1 ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={nativeLanguageCode}
            onValueChange={setNativeLanguageCode}
          >
            {languagesQuery.data?.map((lang) => (
              <DropdownMenuRadioItem
                key={lang.code}
                value={lang.code}
                onClick={() => setNativeLanguageCode(lang.code)}
              >
                <Image
                  src={`https://hatscripts.github.io/circle-flags/flags/${lang.countryCode}.svg`}
                  alt={lang.name}
                  className="mr-2 h-5 w-5 object-cover"
                  width={24}
                  height={24}
                />
                {lang.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        disabled={
          !nativeLanguageCode ||
          updateUserSettingsMutation.isPending ||
          updateUserSettingsMutation.isSuccess
        }
        className="mx-auto"
      >
        {updateUserSettingsMutation.isPending && (
          <Loader2 className="-ml-1 mr-2 h-4 w-4" />
        )}
        Continue
      </Button>
    </form>
  );
}
