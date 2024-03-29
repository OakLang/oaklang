import { create, useStore } from 'zustand';

import type { TimelineFilterOptions } from '~/utils/validators';
import { persist } from 'zustand/middleware';

export const defaultTimelineFilterOptions: TimelineFilterOptions = {
  integrations: [],
  languages: [],
};

export const timelineFilterOptionsStore = create(
  persist<{ filter: TimelineFilterOptions; restFilter: () => void; setFilter: (filter: TimelineFilterOptions) => void }>(
    (set) => ({
      filter: defaultTimelineFilterOptions,
      restFilter: () => {
        set({ filter: defaultTimelineFilterOptions });
      },
      setFilter: (filter) => {
        set({ filter });
      },
    }),
    {
      name: 'timeline-filter-options',
    },
  ),
);

export const useTimelineFilterOptions = () => useStore(timelineFilterOptionsStore, (state) => state.filter);
