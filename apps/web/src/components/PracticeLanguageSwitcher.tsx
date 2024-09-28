"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { useRouter } from "~/i18n/routing";
import { api } from "~/trpc/react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function PracticeLanguageSwitcher() {
  const t = useTranslations("App");
  const practiceLanguage = usePracticeLanguageCode();
  const practiceLanguageQuery =
    api.languages.getPracticeLanguage.useQuery(practiceLanguage);
  const practiceLanguages = api.languages.getPracticeLanguages.useQuery();
  const languagesQuery = api.languages.getLanguages.useQuery();
  const router = useRouter();
  const utils = api.useUtils();

  const otherLanguages = useMemo(
    () =>
      languagesQuery.data?.filter(
        (item) => !practiceLanguages.data?.find((pl) => pl.code === item.code),
      ) ?? [],
    [languagesQuery.data, practiceLanguages.data],
  );

  useEffect(() => {
    void utils.languages.getPracticeLanguages.invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceLanguage]);

  if (!practiceLanguageQuery.isSuccess) {
    return <Skeleton className="h-10 w-14 rounded-full lg:w-32" />;
  }

  return (
    <Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="secondary" className="rounded-full">
              <Image
                src={`https://hatscripts.github.io/circle-flags/flags/${practiceLanguageQuery.data.countryCode}.svg`}
                alt={practiceLanguageQuery.data.name}
                className="-ml-2 mr-2 h-6 w-6 object-cover"
                width={24}
                height={24}
              />
              {practiceLanguageQuery.data.knownWords.toLocaleString()}{" "}
              <span className="ml-1 max-lg:hidden">{t("known-words")}</span>
            </Button>
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            {practiceLanguages.data?.map((item) => (
              <DropdownMenuCheckboxItem
                key={item.code}
                checked={item.code === practiceLanguage}
                onClick={() => router.push(`/app/${item.code}`)}
              >
                <Image
                  src={`https://hatscripts.github.io/circle-flags/flags/${item.countryCode}.svg`}
                  alt={item.name}
                  className="mr-2 h-5 w-5 object-cover"
                  width={24}
                  height={24}
                />
                <span className="mr-2">{item.name}</span>
                <span className="text-muted-foreground ml-auto">
                  {item.knownWords}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {otherLanguages.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("add-a-new-language")}</DropdownMenuLabel>
              {otherLanguages.map((item) => (
                <DropdownMenuItem
                  onClick={() => router.push(`/app/${item.code}`)}
                >
                  <Image
                    src={`https://hatscripts.github.io/circle-flags/flags/${item.countryCode}.svg`}
                    alt={item.name}
                    className="mr-2 h-5 w-5 object-cover"
                    width={24}
                    height={24}
                  />
                  {item.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipContent>{t("practice-language")}</TooltipContent>
    </Tooltip>
  );
}
