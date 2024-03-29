'use client';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import LeadersFilter from './LeadersFilter';
import { LuFilter } from 'react-icons/lu';
import { leadersFilterOptionsStore } from '~/stores/leaders-filter-options-store';
import { useStore } from 'zustand';

export default function LeadersFilterButton() {
  const { filter, setFilter } = useStore(leadersFilterOptionsStore);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

  const totalFilters = useMemo(() => {
    let total = 0;
    if (filter.languages && filter.languages.length > 0) {
      total += filter.languages.length;
    }
    return total;
  }, [filter.languages]);

  return (
    <Popover onOpenChange={setFilterPopoverOpen} open={filterPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <LuFilter className="-ml-1 mr-2" size={20} />
          Filter <span className="ml-2 text-muted-foreground">{totalFilters}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0" side="bottom">
        <LeadersFilter
          onSave={(value) => {
            setFilter(value);
            setFilterPopoverOpen(false);
          }}
          value={filter}
        />
      </PopoverContent>
    </Popover>
  );
}
