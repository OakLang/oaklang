'use client';

import React, { useCallback, useState } from 'react';

import type { FormEvent } from 'react';
import { LuSearch } from 'react-icons/lu';
import { cn } from '~/utils';
import { useRouter } from 'next/navigation';

export default function SearchForm({ defaultValue = '' }: { defaultValue?: string }) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!searchQuery) {
        return;
      }
      const params = new URLSearchParams({ q: searchQuery });
      void router.push(`/search?${params.toString()}`);
    },
    [router, searchQuery],
  );

  return (
    <form className="relative flex-1" onSubmit={handleSubmit}>
      <input
        className="h-10 w-full flex-1 rounded-md border bg-background pl-10 placeholder-muted-foreground outline-none focus:border-accent-foreground"
        id="search"
        onBlur={() => setIsFocused(false)}
        onChange={(e) => {
          setSearchQuery(e.currentTarget.value);
        }}
        onFocus={() => setIsFocused(true)}
        placeholder={isFocused ? 'Search users or activities' : "Type '/' to search"}
        value={searchQuery}
      />
      <LuSearch
        className={cn('pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-base text-muted-foreground', {
          'text-accent-foreground': isFocused,
        })}
      />
    </form>
  );
}
