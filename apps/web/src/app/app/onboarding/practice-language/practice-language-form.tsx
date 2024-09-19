"use client";

import type { FormEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";

export default function PracticeLanguageForm() {
  const [languageCode, setLanguageCode] = useState("");
  const languagesQuery = api.languages.getLanguages.useQuery();

  const language = useMemo(
    () => languagesQuery.data?.find((lang) => lang.code === languageCode),
    [languagesQuery.data, languageCode],
  );

  const router = useRouter();

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!language) {
        return;
      }
      router.push(`/app/${language.code}`);
    },
    [language, router],
  );

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="mx-auto justify-start text-left">
            {language ? (
              <>
                <Image
                  src={`https://hatscripts.github.io/circle-flags/flags/${language.countryCode}.svg`}
                  alt={language.name}
                  className="-ml-1 mr-2 h-5 w-5 object-cover"
                  width={24}
                  height={24}
                />
                <span className="flex-1 truncate">{language.name}</span>
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
            value={languageCode}
            onValueChange={setLanguageCode}
          >
            {languagesQuery.data?.map((lang) => (
              <DropdownMenuRadioItem
                key={lang.code}
                value={lang.code}
                onClick={() => setLanguageCode(lang.code)}
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

      <Button disabled={!languageCode} className="mx-auto">
        Continue
      </Button>
    </form>
  );
}
