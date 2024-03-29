/* eslint-disable react/jsx-max-depth */
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { LuCheck, LuChevronsUpDown, LuX } from 'react-icons/lu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { LeadersFilterOptions } from '~/utils/validators';
import { cn } from '~/utils';
import { defaultLeadersFilterOptions } from '~/stores/leaders-filter-options-store';
import { useState } from 'react';
import { api } from '~/trpc/client';

export default function LeadersFilter({ value, onSave }: { onSave?: (value: LeadersFilterOptions) => void; value: LeadersFilterOptions }) {
  const [filter, setFilter] = useState<LeadersFilterOptions>(value);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const languagesQuery = api.timeline.getProgramLanguages.useQuery();

  return (
    <div>
      <div className="max-h-[512px] space-y-4 overflow-y-auto p-4">
        <div>
          <p className="font-semibold text-foreground">Filter</p>
        </div>
        <div className="space-y-1">
          <Popover onOpenChange={setLanguagePickerOpen} open={languagePickerOpen}>
            <PopoverTrigger asChild>
              <Button className="w-full justify-start text-left text-foreground" id="integrations" type="button" variant="outline">
                <p className="flex-1">Languages</p>
                <p className="/pxt-muted-foreground">{filter.languages?.length ?? 0} selected</p>
                <LuChevronsUpDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Command>
                <CommandInput className="h-10" placeholder="Search language…" />
                <CommandList>
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup heading="Languages">
                    {languagesQuery.isLoading ? (
                      <p>Loading…</p>
                    ) : languagesQuery.isError ? (
                      <p>{languagesQuery.error.message}</p>
                    ) : (
                      languagesQuery.data.map((language) => {
                        const checked = filter.languages?.includes(language.name) == true;
                        return (
                          <CommandItem
                            key={language.name}
                            onSelect={() => {
                              if (checked) {
                                setFilter({
                                  ...filter,
                                  languages: filter.languages?.filter((name) => name !== language.name),
                                });
                              } else {
                                setFilter({
                                  ...filter,
                                  languages: [...(filter.languages ?? []), language.name],
                                });
                              }
                            }}
                            value={language.name}
                          >
                            {language.name}
                            <LuCheck className={cn('ml-auto h-4 w-4', checked ? 'opacity-100' : 'opacity-0')} />
                          </CommandItem>
                        );
                      })
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {filter.languages && filter.languages.length > 0 ? (
            <div className="flex flex-wrap gap-2 pb-4 pt-1">
              {filter.languages.map((languageName) => (
                <Badge className="pr-1" key={languageName} variant="secondary">
                  {languageName}
                  <button
                    className="p-1 text-muted-foreground hover:text-accent-foreground"
                    onClick={() => {
                      setFilter({
                        ...filter,
                        languages: filter.languages?.filter((name) => name !== languageName),
                      });
                    }}
                    type="button"
                  >
                    <LuX className="h-4 w-4" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t px-4 py-2">
        <Button onClick={() => setFilter(defaultLeadersFilterOptions)} variant="ghost">
          Clear
        </Button>
        <Button onClick={() => onSave?.(filter)}>Save</Button>
      </div>
    </div>
  );
}
