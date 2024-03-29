import { create, useStore } from 'zustand';

import type { LeadersFilterOptions } from '~/utils/validators';
import { persist } from 'zustand/middleware';

export const defaultLeadersFilterOptions: LeadersFilterOptions = {
  languages: [],
};

export const leadersFilterOptionsStore = create(
  persist<{ filter: LeadersFilterOptions; restFilter: () => void; setFilter: (filter: LeadersFilterOptions) => void }>(
    (set) => ({
      filter: defaultLeadersFilterOptions,
      restFilter: () => {
        set({ filter: defaultLeadersFilterOptions });
      },
      setFilter: (filter) => {
        set({ filter });
      },
    }),
    {
      name: 'leaders-filter-options',
    },
  ),
);

export const useLeadersFilterOptions = () => useStore(leadersFilterOptionsStore, (state) => state.filter);
