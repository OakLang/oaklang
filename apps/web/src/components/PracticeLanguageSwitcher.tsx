"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { usePracticeLanguage } from "~/providers/PracticeLanguageProvider";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function PracticeLanguageSwitcher() {
  const { practiceLanguage } = usePracticeLanguage();
  const practiceLanguages = api.users.getPracticeLanguages.useQuery();
  const languagesQuery = api.languages.getLanguages.useQuery();
  const router = useRouter();

  const otherLanguages = useMemo(
    () =>
      languagesQuery.data?.filter(
        (item) => !practiceLanguages.data?.find((pl) => pl.code === item.code),
      ) ?? [],
    [languagesQuery.data, practiceLanguages.data],
  );

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
              <span className="ml-1 max-lg:hidden">Known Words</span>
            </Button>
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            {practiceLanguages.data?.map((item) => (
              <DropdownMenuCheckboxItem
                key={item.code}
                checked={item.code === practiceLanguage.code}
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
              <DropdownMenuLabel>Add a new Language</DropdownMenuLabel>
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

      <TooltipContent>Practice Language</TooltipContent>
    </Tooltip>
  );
}
