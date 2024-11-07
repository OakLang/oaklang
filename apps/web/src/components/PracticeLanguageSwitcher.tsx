"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Language } from "@acme/db/schema";

import { usePracticeLanguage } from "~/providers/practice-language-provider";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function PracticeLanguageSwitcher() {
  const t = useTranslations("App");
  const { language } = usePracticeLanguage();

  return (
    <Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="ghost" className="rounded-full pr-3">
              <Image
                src={`https://hatscripts.github.io/circle-flags/flags/${language.countryCode}.svg`}
                alt={language.name}
                className="-ml-2 mr-2 h-6 w-6 object-cover"
                width={24}
                height={24}
              />
              {language.knownWords.toLocaleString()}{" "}
              <span className="ml-1 max-lg:hidden">{t("known-words")}</span>
            </Button>
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <LanguagesDropdownContent practiceLanguageCode={language.code} />
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
    <DropdownMenuContent side="bottom" align="end">
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
