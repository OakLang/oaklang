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
import { api } from "~/trpc/react";

export default function PracticeLanguageForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [languageCode, setLanguageCode] = useState("");
  const languagesQuery = api.languages.getLanguages.useQuery();

  const selectedLanguage = useMemo(
    () => languagesQuery.data?.find((item) => item.code === languageCode),
    [languageCode, languagesQuery.data],
  );
  const utils = api.useUtils();

  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!languageCode) {
        return;
      }
      setIsLoading(true);
      await utils.languages.getPracticeLanguage.fetch(languageCode);
      router.push(`/app/${languageCode}`);
    },
    [languageCode, router, utils.languages.getPracticeLanguage],
  );

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="mx-auto justify-start text-left">
            {selectedLanguage ? (
              <>
                <Image
                  src={`https://hatscripts.github.io/circle-flags/flags/${selectedLanguage.countryCode}.svg`}
                  alt={selectedLanguage.name}
                  className="-ml-1 mr-2 h-5 w-5 object-cover"
                  width={24}
                  height={24}
                />
                <span className="flex-1 truncate">{selectedLanguage.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground flex-1 truncate">
                Choose a practice language
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

      <Button disabled={!languageCode || isLoading} className="mx-auto">
        {isLoading && <Loader2 className="-ml-1 mr-2 h-4 w-4" />}
        Continue
      </Button>
    </form>
  );
}
