import type { ChangeEvent } from "react";
import React, { useCallback, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

import { cn } from "~/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const search = searchParams.get("search");
  const [searchText, setSearchText] = useState(search ?? "");

  const timeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const createQueryString = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      return params.toString();
    },
    [searchParams],
  );

  const handleSearchTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      setSearchText(value);

      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      timeout.current = setTimeout(() => {
        const params = createQueryString("search", value);
        router.push(pathname + "?" + params);
      }, 300);
    },
    [createQueryString, pathname, router],
  );

  const handleClearSearchText = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    const params = createQueryString("search", null);
    router.push(pathname + "?" + params);
    setSearchText("");
  }, [createQueryString, pathname, router]);

  return (
    <div className={cn("relative", className)}>
      <Input
        placeholder="search"
        className="w-full pl-9 pr-10"
        value={searchText}
        onChange={handleSearchTextChange}
      />
      <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      {searchText && (
        <Button
          variant="ghost"
          className="text-muted-foreground absolute right-1 top-1/2 z-10 h-8 w-8 -translate-y-1/2"
          size="icon"
          onClick={handleClearSearchText}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
