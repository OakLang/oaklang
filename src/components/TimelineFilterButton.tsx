'use client';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import React, { useMemo, useState } from 'react';

import { Button } from './ui/button';
import { LuFilter } from 'react-icons/lu';
import TimelineFilter from './TimelineFilter';
import { timelineFilterOptionsStore } from '~/stores/timeline-filter-options-store';
import { useStore } from 'zustand';

export default function TimelineFilterButton() {
  const { filter, setFilter } = useStore(timelineFilterOptionsStore);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

  const totalFilters = useMemo(() => {
    let total = 0;
    if (filter.integrations && filter.integrations.length > 0) {
      total += filter.integrations.length;
    }
    if (filter.languages && filter.languages.length > 0) {
      total += filter.languages.length;
    }
    return total;
  }, [filter.integrations, filter.languages]);

  return (
    <Popover onOpenChange={setFilterPopoverOpen} open={filterPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <LuFilter className="-ml-1 mr-2" size={20} />
          Filter <span className="ml-2 text-muted-foreground">{totalFilters}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0" side="bottom">
        <TimelineFilter
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
