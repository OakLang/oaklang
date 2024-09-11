import React from "react";

import { api } from "~/trpc/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function LanguagePicker({
  onValueChange,
  value,
  disabled,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const languagesQuery = api.languages.getLanguages.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  return (
    <Select onValueChange={onValueChange} value={value} disabled={disabled}>
      <SelectTrigger id="help-language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(languagesQuery.data ?? []).map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
