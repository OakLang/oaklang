"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Language } from "@acme/db/schema";

import { api } from "~/trpc/react";
import { cn } from "~/utils";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function PracticeLanguageSwitcher({
  practiceLanguageCode,
}: {
  practiceLanguageCode: string;
}) {
  const t = useTranslations("App");
  const {
    data: practiceLanguage,
    isPending,
    isError,
    error,
  } = api.languages.getPracticeLanguage.useQuery(practiceLanguageCode);

  if (isPending) {
    return <Skeleton className="h-10 w-14 rounded-full lg:w-32" />;
  }

  if (isError) {
    return <p>{error.message}</p>;
  }

  return (
    <Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="secondary" className="rounded-full">
              <Image
                src={`https://hatscripts.github.io/circle-flags/flags/${practiceLanguage.countryCode}.svg`}
                alt={practiceLanguage.name}
                className="-ml-2 mr-2 h-6 w-6 object-cover"
                width={24}
                height={24}
              />
              {practiceLanguage.knownWords.toLocaleString()}{" "}
              <span className="ml-1 max-lg:hidden">{t("known-words")}</span>
            </Button>
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <LanguagesDropdownContent practiceLanguageCode={practiceLanguageCode} />
      </DropdownMenu>

      <TooltipContent>{t("practice-language")}</TooltipContent>
    </Tooltip>
  );
}

const LanguagesDropdownContent = ({
  practiceLanguageCode,
}: {
  practiceLanguageCode: string;
}) => {
  const t = useTranslations("App");

  const practiceLanguagesQuery = api.languages.getPracticeLanguages.useQuery(
    undefined,
    { staleTime: 0 },
  );
  const languagesQuery = api.languages.getLanguages.useQuery();

  const otherLanguages = useMemo(
    () =>
      languagesQuery.data?.filter(
        (item) =>
          !practiceLanguagesQuery.data?.find((pl) => pl.code === item.code),
      ) ?? [],
    [languagesQuery.data, practiceLanguagesQuery.data],
  );

  return (
    <DropdownMenuContent>
      <DropdownMenuGroup>
        {practiceLanguagesQuery.data?.map((item) => (
          <LanguageItem
            key={item.code}
            lang={item}
            checked={item.code === practiceLanguageCode}
          />
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      {otherLanguages.length > 0 && (
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("add-a-new-language")}</DropdownMenuLabel>
          {otherLanguages.map((item) => (
            <LanguageItem
              key={item.code}
              lang={item}
              checked={item.code === practiceLanguageCode}
            />
          ))}
        </DropdownMenuGroup>
      )}
    </DropdownMenuContent>
  );
};

const LanguageItem = ({
  lang,
  checked,
}: {
  lang: Language;
  checked?: boolean;
}) => {
  return (
    <DropdownMenuItem key={lang.code} asChild>
      <Link href={`/app/${lang.code}`}>
        <CheckIcon
          className={cn("mr-2 h-4 w-4 opacity-0", {
            "opacity-100": checked,
          })}
        />
        <Image
          src={`https://hatscripts.github.io/circle-flags/flags/${lang.countryCode}.svg`}
          alt={lang.name}
          className="mr-2 h-5 w-5 object-cover"
          width={24}
          height={24}
        />
        {lang.name}
      </Link>
    </DropdownMenuItem>
  );
};
