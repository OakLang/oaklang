import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function SimpleSelect({
  options,
  onValueChange,
  value,
  placeholder,
  defaultValue,
}: {
  options: { value: string; name?: string }[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Select
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem value={option.value} key={option.value}>
            {option.name ?? option.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
